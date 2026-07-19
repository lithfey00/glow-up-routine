import { useEffect, useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import { useMobileApp } from '../context/MobileAppContext';
import { GlassCard, EmptyState, Skeleton, Pill } from '../components/ui';
import { haptic } from '../lib/haptics';
import { supabase } from '../../lib/supabase';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'Sparkles', gradient: 'bg-gradient-to-r from-violet-500 to-pink-500' },
  { id: 'beauty', label: 'Beauty', icon: 'Palette', gradient: 'bg-gradient-to-r from-pink-400 to-rose-400' },
  { id: 'self-care', label: 'Self-Care', icon: 'Heart', gradient: 'bg-gradient-to-r from-emerald-400 to-teal-400' },
  { id: 'mindset', label: 'Mindset', icon: 'Brain', gradient: 'bg-gradient-to-r from-amber-400 to-orange-400' },
  { id: 'health', label: 'Health', icon: 'Activity', gradient: 'bg-gradient-to-r from-blue-400 to-cyan-400' },
] as const;

const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'] as const;

export function ChallengesScreen() {
  const { challenges, completedToday, toggleChallenge, loading, sessionId } = useMobileApp();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [diffFilter, setDiffFilter] = useState<string>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavOnly, setShowFavOnly] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('user_rewards').select('reward_id').eq('user_id', sessionId);
      void data;
    })();
  }, [sessionId]);

  const filtered = useMemo(() => {
    let list = challenges;
    if (catFilter !== 'all') list = list.filter((c) => c.category === catFilter);
    if (diffFilter !== 'all') list = list.filter((c) => c.difficulty === diffFilter);
    if (showFavOnly) list = list.filter((c) => favorites.has(c.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }
    return list;
  }, [challenges, catFilter, diffFilter, showFavOnly, favorites, search]);

  function toggleFav(id: string) {
    haptic('selection');
    setFavorites((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-28 animate-page-enter">
      <h1 className="text-[28px] font-bold text-gray-800 dark:text-purple-100 font-quicksand tracking-tight mb-4">Challenges</h1>

      {/* Search */}
      <div className="relative mb-4">
        <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search challenges..."
          className="w-full pl-12 pr-14 py-3.5 rounded-[22px] glass text-[14px] text-gray-700 dark:text-purple-100 focus:outline-none focus:ring-2 focus:ring-pink-300/50 font-medium placeholder:text-gray-400"
        />
        <button
          onClick={() => { setShowFavOnly(!showFavOnly); haptic('selection'); }}
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-[16px] flex items-center justify-center transition-all pressable ${showFavOnly ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/30' : 'bg-gray-100 dark:bg-slate-700/50 text-gray-400'}`}
        >
          <Icons.Heart className="w-4 h-4" fill={showFavOnly ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 no-scrollbar">
        {CATEGORIES.map((cat) => {
          const IconComp = (Icons[cat.icon as keyof typeof Icons] as typeof Icons.Sparkles) || Icons.Sparkles;
          const active = catFilter === cat.id;
          return (
            <Pill key={cat.id} active={active} onClick={() => { setCatFilter(cat.id); haptic('selection'); }} gradient={cat.gradient}>
              <span className="flex items-center gap-1.5"><IconComp className="w-3.5 h-3.5" /> {cat.label}</span>
            </Pill>
          );
        })}
      </div>

      {/* Difficulty */}
      <div className="flex gap-2 mb-5">
        {DIFFICULTIES.map((d) => (
          <Pill key={d} active={diffFilter === d} onClick={() => { setDiffFilter(d); haptic('selection'); }}>
            <span className="capitalize">{d === 'all' ? 'All levels' : d}</span>
          </Pill>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState emoji="🔍" title="No challenges found" subtitle="Try a different search or filter." />
      ) : (
        <div className="space-y-3">
          {filtered.map((c, i) => {
            const done = completedToday.has(c.id);
            const isFav = favorites.has(c.id);
            const IconComp = (Icons[c.icon as keyof typeof Icons] as typeof Icons.Sparkles) || Icons.Sparkles;
            const diffColor = c.difficulty === 'easy' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : c.difficulty === 'medium' ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/20';
            return (
              <div key={c.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <GlassCard variant="sheen" className="p-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-[20px] bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center flex-shrink-0 shadow-md shadow-violet-500/20">
                      <IconComp className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[15px] font-bold text-gray-800 dark:text-purple-100 font-quicksand">{c.title}</h3>
                        <button onClick={() => toggleFav(c.id)} className="flex-shrink-0 pressable -mt-0.5">
                          <Icons.Heart className={`w-[18px] h-[18px] transition-all ${isFav ? 'text-pink-500 scale-110' : 'text-gray-300 dark:text-slate-600'}`} fill={isFav ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                      <p className="text-[12px] text-gray-400 dark:text-purple-300/50 mt-1 leading-relaxed line-clamp-2">{c.description}</p>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-purple-300/70 bg-gray-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-full">
                          <Icons.Clock className="w-3 h-3" /> {c.duration_minutes}m
                        </span>
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize ${diffColor}`}>
                          {c.difficulty}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-violet-600 dark:text-purple-300 bg-violet-50 dark:bg-purple-900/30 px-2.5 py-1 rounded-full">
                          <Icons.Zap className="w-3 h-3" fill="currentColor" /> +{c.glow_points} XP
                        </span>
                      </div>
                      <button
                        onClick={() => toggleChallenge(c.id)}
                        className={`mt-3.5 w-full py-3 rounded-[18px] text-[13px] font-bold transition-all pressable active:scale-[0.98] ${done ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-md shadow-pink-500/25'}`}
                      >
                        {done ? '✓ Completed' : 'Complete Challenge'}
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
