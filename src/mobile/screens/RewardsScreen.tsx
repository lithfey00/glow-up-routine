import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { useMobileApp } from '../context/MobileAppContext';
import { GlassCard, Skeleton, EmptyState } from '../components/ui';
import { supabase } from '../../lib/supabase';
import { haptic } from '../lib/haptics';
import { triggerConfetti } from '../../lib/confetti';
import type { ShopItem, UserShopItem } from '../../lib/types';

type Section = 'shop' | 'badges' | 'mystery';

export function RewardsScreen() {
  const { userStats, achievements, unlockedAchievements, sessionId, showToast, refresh } = useMobileApp();
  const [section, setSection] = useState<Section>('shop');
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [equipped, setEquipped] = useState<Set<string>>(new Set());
  const [mysteryOpened, setMysteryOpened] = useState(false);
  const [mysteryReward, setMysteryReward] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [items, userItems] = await Promise.all([
        supabase.from('shop_items').select('*').order('price'),
        supabase.from('user_shop_items').select('shop_item_id, is_equipped').eq('user_id', sessionId),
      ]);
      setShopItems((items.data || []) as ShopItem[]);
      const ui = (userItems.data || []) as UserShopItem[];
      setOwned(new Set(ui.map((u) => u.shop_item_id)));
      setEquipped(new Set(ui.filter((u) => u.is_equipped).map((u) => u.shop_item_id)));
      setLoading(false);
    })();
  }, [sessionId]);

  async function purchase(item: ShopItem) {
    if (owned.has(item.id)) return;
    if ((userStats?.glow_points || 0) < item.price) { haptic('warning'); return; }
    const { error } = await supabase.from('user_shop_items').insert({
      user_id: sessionId, shop_item_id: item.id, is_equipped: false,
    });
    if (!error) {
      const { data: stats } = await supabase.from('user_stats').select('glow_points').eq('user_id', sessionId).maybeSingle();
      if (stats) await supabase.from('user_stats').update({ glow_points: stats.glow_points - item.price }).eq('user_id', sessionId);
      setOwned((prev) => new Set([...prev, item.id]));
      haptic('success');
      triggerConfetti(50);
      showToast(`${item.name} unlocked!`, 'reward');
      refresh();
    }
  }

  async function toggleEquip(item: ShopItem) {
    if (!owned.has(item.id)) return;
    const sameCat = shopItems.filter((i) => i.category === item.category);
    await Promise.all(sameCat.map((i) =>
      supabase.from('user_shop_items')
        .update({ is_equipped: i.id === item.id ? !equipped.has(item.id) : false })
        .eq('user_id', sessionId).eq('shop_item_id', i.id)
    ));
    haptic('selection');
    const { data: ui } = await supabase.from('user_shop_items').select('shop_item_id, is_equipped').eq('user_id', sessionId);
    const items = (ui || []) as UserShopItem[];
    setEquipped(new Set(items.filter((u) => u.is_equipped).map((u) => u.shop_item_id)));
  }

  async function openMystery() {
    if (mysteryOpened) return;
    const reward = Math.floor(Math.random() * 150) + 50;
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('daily_reward_claims').insert({
      user_id: sessionId, claim_date: today, reward_type: 'mystery', glow_points_awarded: reward,
    });
    if (!error) {
      setMysteryOpened(true);
      setMysteryReward(reward);
      haptic('success');
      triggerConfetti(80);
      const { data: stats } = await supabase.from('user_stats').select('glow_points').eq('user_id', sessionId).maybeSingle();
      if (stats) await supabase.from('user_stats').update({ glow_points: stats.glow_points + reward }).eq('user_id', sessionId);
      showToast(`Mystery box: +${reward} XP!`, 'coins');
      refresh();
    } else {
      setMysteryOpened(true);
    }
  }

  if (loading) {
    return <div className="px-4 pt-6 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>;
  }

  return (
    <div className="px-4 pt-6 pb-28 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-purple-100">Rewards</h1>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-full">
          <Icons.Zap className="w-3.5 h-3.5 text-violet-600 dark:text-purple-300" fill="currentColor" />
          <span className="text-sm font-bold text-violet-700 dark:text-purple-200">{userStats?.glow_points || 0}</span>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2">
        {(['shop', 'badges', 'mystery'] as Section[]).map((s) => (
          <button key={s} onClick={() => { setSection(s); haptic('selection'); }} className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold capitalize transition-all ${section === s ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-md' : 'bg-white/60 dark:bg-slate-800/60 text-gray-500 dark:text-purple-300/70'}`}>
            {s === 'shop' ? 'Shop' : s === 'badges' ? 'Badges' : 'Mystery'}
          </button>
        ))}
      </div>

      {section === 'shop' && (
        <div className="grid grid-cols-2 gap-3">
          {shopItems.map((item) => {
            const isOwned = owned.has(item.id);
            const isEquipped = equipped.has(item.id);
            const canAfford = (userStats?.glow_points || 0) >= item.price;
            const IconComp = (Icons[item.icon as keyof typeof Icons] as typeof Icons.Sparkles) || Icons.Sparkles;
            return (
              <GlassCard key={item.id} className="overflow-hidden">
                <div className={`aspect-square bg-gradient-to-br ${item.preview_gradient} flex items-center justify-center relative`}>
                  <IconComp className="w-10 h-10 text-white/90" />
                  {isEquipped && <span className="absolute top-2 right-2 px-2 py-0.5 bg-white/90 rounded-full text-[10px] font-bold text-violet-600">Equipped</span>}
                </div>
                <div className="p-3">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-purple-100 truncate">{item.name}</h4>
                  <p className="text-[10px] text-gray-400 truncate mb-2">{item.description}</p>
                  {isOwned ? (
                    <button onClick={() => toggleEquip(item)} className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${isEquipped ? 'bg-violet-100 dark:bg-purple-900/40 text-violet-600 dark:text-purple-200' : 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'}`}>
                      {isEquipped ? 'Unequip' : 'Equip'}
                    </button>
                  ) : (
                    <button onClick={() => purchase(item)} disabled={!canAfford} className={`w-full py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 ${canAfford ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' : 'bg-gray-100 dark:bg-slate-700/40 text-gray-400'}`}>
                      <Icons.Zap className="w-3 h-3" fill="currentColor" /> {item.price}
                    </button>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {section === 'badges' && (
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((a) => {
            const unlocked = unlockedAchievements.has(a.id);
            const IconComp = (Icons[a.icon as keyof typeof Icons] as typeof Icons.Award) || Icons.Award;
            const rarityColor = a.rarity === 'legendary' ? 'from-amber-400 to-yellow-500' : a.rarity === 'epic' ? 'from-violet-400 to-purple-500' : a.rarity === 'rare' ? 'from-blue-400 to-cyan-500' : 'from-gray-300 to-gray-400';
            return (
              <GlassCard key={a.id} className={`p-4 ${unlocked ? '' : 'opacity-60'}`}>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${rarityColor} flex items-center justify-center mb-2 ${unlocked ? 'shadow-lg' : 'grayscale'}`}>
                  <IconComp className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-purple-100">{a.name}</h4>
                <p className="text-[10px] text-gray-400 dark:text-purple-300/60 leading-snug mt-0.5">{a.description}</p>
                <span className="inline-block mt-1.5 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-purple-300/70">{a.rarity} • {a.tier}</span>
              </GlassCard>
            );
          })}
          {achievements.length === 0 && <EmptyState icon={<Icons.Award className="w-7 h-7 text-amber-300" />} title="No badges yet" subtitle="Complete challenges to earn badges." />}
        </div>
      )}

      {section === 'mystery' && (
        <div className="flex flex-col items-center py-8">
          <button onClick={openMystery} disabled={mysteryOpened} className="relative">
            <div className={`w-48 h-48 rounded-3xl bg-gradient-to-br from-violet-500 via-pink-500 to-amber-400 flex items-center justify-center shadow-2xl transition-all ${mysteryOpened ? 'scale-95 opacity-70' : 'hover:scale-105 animate-glow-pulse'}`}>
              <Icons.Gift className="w-20 h-20 text-white" />
            </div>
          </button>
          <p className="mt-6 text-base font-bold text-gray-800 dark:text-purple-100">
            {mysteryOpened ? (mysteryReward !== null ? `You won +${mysteryReward} XP!` : 'Already opened today') : 'Tap to open your mystery box'}
          </p>
          <p className="text-xs text-gray-400 mt-1">One mystery box per day</p>
        </div>
      )}
    </div>
  );
}
