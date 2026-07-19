import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { useMobileApp } from '../context/MobileAppContext';
import { GlassCard, Skeleton, EmptyState, Pill } from '../components/ui';
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
  const [opening, setOpening] = useState(false);
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
    if (mysteryOpened || opening) return;
    setOpening(true);
    haptic('medium');
    setTimeout(() => haptic('heavy'), 200);
    const reward = Math.floor(Math.random() * 150) + 50;
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('daily_reward_claims').insert({
      user_id: sessionId, claim_date: today, reward_type: 'mystery', glow_points_awarded: reward,
    });
    if (!error) {
      setMysteryOpened(true);
      setMysteryReward(reward);
      setTimeout(() => {
        haptic('success');
        triggerConfetti(80);
      }, 400);
      const { data: stats } = await supabase.from('user_stats').select('glow_points').eq('user_id', sessionId).maybeSingle();
      if (stats) await supabase.from('user_stats').update({ glow_points: stats.glow_points + reward }).eq('user_id', sessionId);
      showToast(`Mystery box: +${reward} XP!`, 'coins');
      refresh();
    } else {
      setMysteryOpened(true);
    }
    setOpening(false);
  }

  if (loading) {
    return <div className="px-4 pt-6 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>;
  }

  return (
    <div className="px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-28 space-y-5 animate-page-enter">
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-bold text-gray-800 dark:text-purple-100 font-quicksand tracking-tight">Rewards</h1>
        <div className="flex items-center gap-1.5 px-3.5 py-2 glass rounded-full">
          <Icons.Zap className="w-4 h-4 text-violet-500" fill="currentColor" />
          <span className="text-[14px] font-bold text-violet-600 dark:text-purple-200 font-quicksand">{userStats?.glow_points || 0}</span>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2">
        {(['shop', 'badges', 'mystery'] as Section[]).map((s) => (
          <Pill key={s} active={section === s} onClick={() => { setSection(s); haptic('selection'); }}>
            {s === 'shop' ? 'Shop' : s === 'badges' ? 'Badges' : 'Mystery'}
          </Pill>
        ))}
      </div>

      {section === 'shop' && (
        <div className="grid grid-cols-2 gap-3">
          {shopItems.map((item, i) => {
            const isOwned = owned.has(item.id);
            const isEquipped = equipped.has(item.id);
            const canAfford = (userStats?.glow_points || 0) >= item.price;
            const IconComp = (Icons[item.icon as keyof typeof Icons] as typeof Icons.Sparkles) || Icons.Sparkles;
            return (
              <div key={item.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                <GlassCard variant="sheen" className="overflow-hidden">
                  <div className={`aspect-square bg-gradient-to-br ${item.preview_gradient} flex items-center justify-center relative`}>
                    <IconComp className="w-10 h-10 text-white/90 drop-shadow-lg" />
                    {isEquipped && <span className="absolute top-2 right-2 px-2.5 py-1 bg-white/90 rounded-full text-[10px] font-bold text-violet-600 shadow-sm">Equipped</span>}
                    {isOwned && !isEquipped && <span className="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow-sm"><Icons.Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={3} /></span>}
                  </div>
                  <div className="p-3">
                    <h4 className="text-[13px] font-bold text-gray-800 dark:text-purple-100 truncate font-quicksand">{item.name}</h4>
                    <p className="text-[10px] text-gray-400 truncate mb-2.5">{item.description}</p>
                    {isOwned ? (
                      <button onClick={() => toggleEquip(item)} className={`w-full py-2.5 rounded-[14px] text-[12px] font-bold transition-all pressable active:scale-95 ${isEquipped ? 'bg-gray-100 dark:bg-slate-700/50 text-gray-500 dark:text-purple-300/70' : 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md shadow-pink-500/20'}`}>
                        {isEquipped ? 'Unequip' : 'Equip'}
                      </button>
                    ) : (
                      <button onClick={() => purchase(item)} disabled={!canAfford} className={`w-full py-2.5 rounded-[14px] text-[12px] font-bold transition-all pressable active:scale-95 flex items-center justify-center gap-1 ${canAfford ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-gray-100 dark:bg-slate-700/40 text-gray-400'}`}>
                        <Icons.Zap className="w-3.5 h-3.5" fill="currentColor" /> {item.price}
                      </button>
                    )}
                  </div>
                </GlassCard>
              </div>
            );
          })}
        </div>
      )}

      {section === 'badges' && (
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((a, i) => {
            const unlocked = unlockedAchievements.has(a.id);
            const IconComp = (Icons[a.icon as keyof typeof Icons] as typeof Icons.Award) || Icons.Award;
            const rarityColor = a.rarity === 'legendary' ? 'from-amber-400 to-yellow-500' : a.rarity === 'epic' ? 'from-violet-400 to-purple-500' : a.rarity === 'rare' ? 'from-blue-400 to-cyan-500' : 'from-gray-300 to-gray-400';
            return (
              <div key={a.id} className={`animate-fade-in ${unlocked ? 'animate-badge-pop' : ''}`} style={{ animationDelay: `${i * 0.05}s` }}>
                <GlassCard className={`p-4 ${unlocked ? '' : 'opacity-50'}`}>
                  <div className={`w-12 h-12 rounded-[20px] bg-gradient-to-br ${rarityColor} flex items-center justify-center mb-2.5 ${unlocked ? 'shadow-lg' : 'grayscale'}`}>
                    <IconComp className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-[14px] font-bold text-gray-800 dark:text-purple-100 font-quicksand">{a.name}</h4>
                  <p className="text-[10px] text-gray-400 dark:text-purple-300/50 leading-snug mt-1">{a.description}</p>
                  <span className="inline-block mt-2 text-[9px] font-bold uppercase px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-700/50 text-gray-500 dark:text-purple-300/60">{a.rarity} · {a.tier}</span>
                </GlassCard>
              </div>
            );
          })}
          {achievements.length === 0 && <EmptyState emoji="🏅" title="No badges yet" subtitle="Complete challenges to earn badges." />}
        </div>
      )}

      {section === 'mystery' && (
        <div className="flex flex-col items-center py-10 animate-fade-in-scale">
          <button onClick={openMystery} disabled={mysteryOpened || opening} className="relative pressable">
            <div className={`w-52 h-52 rounded-[36px] bg-gradient-to-br from-violet-500 via-pink-500 to-amber-400 flex items-center justify-center shadow-2xl shadow-pink-500/30 transition-all ${mysteryOpened ? 'scale-95 opacity-60' : opening ? 'animate-wiggle' : 'animate-glow-pulse'}`}>
              <Icons.Gift className={`w-24 h-24 text-white transition-transform ${opening ? 'scale-110' : ''}`} />
            </div>
            {!mysteryOpened && !opening && (
              <>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center animate-sparkle"><Icons.Sparkle className="w-3 h-3 text-white" fill="currentColor" /></div>
                <div className="absolute -bottom-2 -left-2 w-5 h-5 rounded-full bg-pink-400 flex items-center justify-center animate-sparkle" style={{ animationDelay: '0.5s' }}><Icons.Sparkle className="w-2.5 h-2.5 text-white" fill="currentColor" /></div>
              </>
            )}
          </button>
          <p className="mt-8 text-[17px] font-bold text-gray-800 dark:text-purple-100 font-quicksand">
            {mysteryOpened ? (mysteryReward !== null ? `You won +${mysteryReward} XP!` : 'Already opened today') : 'Tap to open your mystery box'}
          </p>
          <p className="text-[12px] text-gray-400 mt-1.5 font-medium">One mystery box per day · 50–200 XP inside</p>
        </div>
      )}
    </div>
  );
}
