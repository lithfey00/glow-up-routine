import { useEffect, useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import { useMobileApp } from '../context/MobileAppContext';
import { GlassCard, EmptyState, Skeleton } from '../components/ui';
import { haptic } from '../lib/haptics';
import { supabase } from '../../lib/supabase';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'Sparkles', gradient: 'from-violet-400 to-pink-400' },
  { id: 'beauty', label: 'Beauty', icon: 'Palette', gradient: 'from-pink-400 to-rose-400' },
  { id: 'self-care', label: 'Self-Care', icon: 'Heart', gradient: 'from-emerald-400 to-teal-400' },
  { id: 'mindset', label: 'Mindset', icon: 'Brain', gradient: 'from-amber-400 to-orange-400' },
  { id: 'health', label: 'Health', icon: 'Activity', gradient: 'from-blue-400 to-cyan-400' },
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
    <div className="px-4 pt-6 pb-28 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-purple-100 mb-4">Challenges</h1>

      {/* Search */}
      <div className="relative mb-4">
        <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search challenges..."
          className="w-full pl-11 pr-12 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl border border-white/60 dark:border-purple-900/40 text-sm text-gray-700 dark:text-purple-100 focus:outline-none focus:ring-2 focus:ring-pink-300"
        />
        <button
          onClick={() => { setShowFavOnly(!showFavOnly); haptic('selection'); }}
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${showFavOnly ? 'bg-pink-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'}`}
        >
          <Icons.Heart className="w-4 h-4" fill={showFavOnly ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4">
        {CATEGORIES.map((cat) => {
          const IconComp = (Icons[cat.icon as keyof typeof Icons] as typeof Icons.Sparkles) || Icons.Sparkles;
          const active = catFilter === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => { setCatFilter(cat.id); haptic('selection'); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${active ? `bg-gradient-to-r ${cat.gradient} text-white shadow-md` : 'bg-white/60 dark:bg-slate-800/60 text-gray-500 dark:text-purple-300/70'}`}
            >
              <IconComp className="w-3.5 h-3.5" /> {cat.label}
            </button>
          );
        })}
      </div>

      {/* Difficulty */}
      <div className="flex gap-2 mb-5">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            onClick={() => { setDiffFilter(d); haptic('selection'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${diffFilter === d ? 'bg-violet-500 text-white shadow-md' : 'bg-white/60 dark:bg-slate-800/60 text-gray-500 dark:text-purple-300/70'}`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Icons.SearchX className="w-7 h-7 text-pink-300" />} title="No challenges found" subtitle="Try a different search or filter." />
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const done = completedToday.has(c.id);
            const isFav = favorites.has(c.id);
            const IconComp = (Icons[c.icon as keyof typeof Icons] as typeof Icons.Sparkles) || Icons.Sparkles;
            const diffColor = c.difficulty === 'easy' ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : c.difficulty === 'medium' ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-rose-500 bg-rose-50 dark:bg-rose-900/20';
            return (
              <GlassCard key={c.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                    <IconComp className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-gray-800 dark:text-purple-100">{c.title}</h3>
                      <button onClick={() => toggleFav(c.id)} className="flex-shrink-0">
                        <Icons.Heart className={`w-4 h-4 ${isFav ? 'text-pink-500' : 'text-gray-300 dark:text-slate-600'}`} fill={isFav ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-purple-300/60 mt-0.5 leading-relaxed line-clamp-2">{c.description}</p>
                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-purple-300/70 bg-gray-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-full">
                        <Icons.Clock className="w-3 h-3" /> {c.duration_minutes}m
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${diffColor}`}>
                        {c.difficulty}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-violet-600 dark:text-purple-300 bg-violet-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                        <Icons.Zap className="w-3 h-3" fill="currentColor" /> +{c.glow_points} XP
                      </span>
                    </div>
                    <button
                      onClick={() => toggleChallenge(c.id)}
                      className={`mt-3 w-full py-2.5 rounded-2xl text-xs font-bold transition-all ${done ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md' : 'bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-md hover:scale-[1.02]'}`}
                    >
                      {done ? 'Completed!' : 'Complete'}
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
