import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ShopItem, UserShopItem } from '../lib/types';
import { triggerConfetti } from '../lib/confetti';

interface GlowShopProps {
  userId: string;
  glowPoints: number;
  onPurchase: (cost: number) => void;
}

const categoryFilters = ['all', 'theme', 'wallpaper', 'avatar', 'icon', 'buddy_skin', 'decoration'] as const;
type CategoryFilter = typeof categoryFilters[number];

export function GlowShop({ userId, glowPoints, onPurchase }: GlowShopProps) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [equipped, setEquipped] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    loadShop();
  }, [userId]);

  async function loadShop() {
    const [itemsRes, ownedRes] = await Promise.all([
      supabase.from('shop_items').select('*').order('price', { ascending: true }),
      supabase.from('user_shop_items').select('shop_item_id, is_equipped').eq('user_id', userId),
    ]);
    setItems((itemsRes.data || []) as ShopItem[]);
    const ownedData = (ownedRes.data || []) as UserShopItem[];
    setOwned(new Set(ownedData.map((o) => o.shop_item_id)));
    setEquipped(new Set(ownedData.filter((o) => o.is_equipped).map((o) => o.shop_item_id)));
  }

  async function purchase(item: ShopItem) {
    if (owned.has(item.id) || glowPoints < item.price || purchasing) return;
    setPurchasing(item.id);
    const { error } = await supabase.from('user_shop_items').insert({
      user_id: userId,
      shop_item_id: item.id,
      is_equipped: false,
    });
    if (!error) {
      setOwned((prev) => new Set([...prev, item.id]));
      onPurchase(item.price);
      triggerConfetti(50);
    }
    setPurchasing(null);
  }

  async function toggleEquip(item: ShopItem) {
    if (!owned.has(item.id)) return;
    const isEquipped = equipped.has(item.id);
    // Unequip all items in same category, then equip selected
    const sameCategoryItems = items.filter((i) => i.category === item.category);
    await Promise.all(
      sameCategoryItems.map(async (i) => {
        if (i.id === item.id && !isEquipped) {
          return supabase.from('user_shop_items')
            .update({ is_equipped: true })
            .eq('user_id', userId)
            .eq('shop_item_id', i.id);
        } else if (i.id === item.id && isEquipped) {
          return supabase.from('user_shop_items')
            .update({ is_equipped: false })
            .eq('user_id', userId)
            .eq('shop_item_id', i.id);
        } else {
          return supabase.from('user_shop_items')
            .update({ is_equipped: false })
            .eq('user_id', userId)
            .eq('shop_item_id', i.id);
        }
      })
    );
    await loadShop();
  }

  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter);

  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-3xl shadow-xl border-2 border-pink-100 dark:border-purple-900/40 p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg">
            <Icons.ShoppingBag className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-purple-100">Glow Shop</h3>
            <p className="text-sm text-gray-500 dark:text-purple-300/70">Unlock themes, avatars & more</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-full">
          <Icons.Zap className="w-4 h-4 text-violet-600 dark:text-purple-300" fill="currentColor" />
          <span className="font-bold text-violet-700 dark:text-purple-200">{glowPoints}</span>
          <span className="text-xs text-violet-500 dark:text-purple-300/70">Glow Points</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {categoryFilters.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
              filter === cat
                ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-slate-700/40 text-gray-500 dark:text-purple-300/70 hover:bg-gray-200 dark:hover:bg-slate-600/40'
            }`}
          >
            {cat === 'all' ? 'All' : cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((item) => {
          const isOwned = owned.has(item.id);
          const isEquipped = equipped.has(item.id);
          const canAfford = glowPoints >= item.price;
          const IconComp = (Icons[item.icon as keyof typeof Icons] as typeof Icons.Sparkles) || Icons.Sparkles;

          return (
            <div
              key={item.id}
              className={`rounded-2xl border-2 overflow-hidden transition-all ${
                isEquipped
                  ? 'border-violet-400 dark:border-purple-500 shadow-lg'
                  : 'border-gray-100 dark:border-slate-600/40 hover:shadow-md'
              }`}
            >
              <div className={`aspect-square bg-gradient-to-br ${item.preview_gradient} flex items-center justify-center relative`}>
                <IconComp className="w-10 h-10 text-white/90" strokeWidth={2} />
                {isEquipped && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-white/90 rounded-full text-xs font-bold text-violet-600">
                    Equipped
                  </div>
                )}
              </div>
              <div className="p-3 bg-white dark:bg-slate-700/40">
                <h4 className="text-sm font-bold text-gray-800 dark:text-purple-100 truncate">{item.name}</h4>
                <p className="text-xs text-gray-400 dark:text-purple-300/50 truncate mb-2">{item.description}</p>
                {isOwned ? (
                  <button
                    onClick={() => toggleEquip(item)}
                    className={`w-full py-2 rounded-lg text-xs font-semibold transition-all ${
                      isEquipped
                        ? 'bg-violet-100 dark:bg-purple-900/40 text-violet-600 dark:text-purple-200'
                        : 'bg-gradient-to-r from-violet-500 to-pink-500 text-white hover:scale-105'
                    }`}
                  >
                    {isEquipped ? 'Unequip' : 'Equip'}
                  </button>
                ) : (
                  <button
                    onClick={() => purchase(item)}
                    disabled={!canAfford || purchasing === item.id}
                    className={`w-full py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                      canAfford
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:scale-105'
                        : 'bg-gray-100 dark:bg-slate-600/40 text-gray-400 dark:text-purple-300/40 cursor-not-allowed'
                    }`}
                  >
                    <Icons.Zap className="w-3 h-3" fill="currentColor" />
                    {item.price}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
