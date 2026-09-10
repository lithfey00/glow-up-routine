import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { useMobileApp } from '../context/MobileAppContext';
import { GlassCard, Skeleton, EmptyState } from '../components/ui';
import { supabase } from '../../lib/supabase';
import { getLevelInfo } from '../../lib/statsUtils';

type Period = 'week' | 'month';

interface DayActivity { date: string; count: number; }

export function ProgressScreen() {
  const { userStats, sessionId, loading } = useMobileApp();
  const [period, setPeriod] = useState<Period>('week');
  const [activity, setActivity] = useState<DayActivity[]>([]);
  const [stats, setStats] = useState<{ completed: number; xp: number; minutes: number; favoriteCat: string | null }>({ completed: 0, xp: 0, minutes: 0, favoriteCat: null });

  const levelInfo = getLevelInfo(userStats?.glow_points || 0);

  useEffect(() => {
    (async () => {
      const days = period === 'week' ? 7 : 30;
      const start = new Date();
      start.setDate(start.getDate() - (days - 1));
      start.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('user_progress')
        .select('completed_at, challenges(category, glow_points, duration_minutes)')
        .eq('user_id', sessionId)
        .gte('completed_at', start.toISOString());

      const dayMap: Record<string, number> = {};
      const catCount: Record<string, number> = {};
      let xp = 0, minutes = 0;
      (data || []).forEach((p) => {
        const d = (p as { completed_at: string }).completed_at.split('T')[0];
        dayMap[d] = (dayMap[d] || 0) + 1;
        const ch = (p as unknown as { challenges: { category: string; glow_points: number; duration_minutes: number } | null }).challenges;
        if (ch) {
          catCount[ch.category] = (catCount[ch.category] || 0) + 1;
          xp += ch.glow_points;
          minutes += ch.duration_minutes;
        }
      });

      const arr: DayActivity[] = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const ds = d.toISOString().split('T')[0];
        arr.push({ date: ds, count: dayMap[ds] || 0 });
      }
      setActivity(arr);
      const favoriteCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
      setStats({ completed: (data || []).length, xp, minutes, favoriteCat });
    })();
  }, [sessionId, period]);

  if (loading) {
    return <div className="px-4 pt-6 space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-32 w-full" /></div>;
  }

  const maxCount = Math.max(...activity.map((a) => a.count), 1);
  const catColors: Record<string, string> = {
    beauty: 'bg-pink-400', 'self-care': 'bg-emerald-400', mindset: 'bg-amber-400', health: 'bg-blue-400',
  };

  return (
    <div className="px-4 pt-6 pb-28 space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-purple-100">Progress</h1>

      {/* Period toggle */}
      <div className="flex gap-2">
        {(['week', 'month'] as Period[]).map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold capitalize transition-all ${period === p ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md' : 'bg-white/60 dark:bg-slate-800/60 text-gray-500 dark:text-purple-300/70'}`}>
            {p === 'week' ? 'Weekly' : 'Monthly'}
          </button>
        ))}
      </div>

      {/* Level + XP */}
      <GlassCard className="p-5 bg-gradient-to-br from-violet-100/60 to-pink-100/60 dark:from-purple-900/30 dark:to-pink-900/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-500 dark:text-purple-300/70">Current Level</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-purple-100">Level {levelInfo.level} • {levelInfo.name}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Icons.Star className="w-6 h-6 text-white" fill="currentColor" />
          </div>
        </div>
        <div className="h-3 bg-white/60 dark:bg-slate-700/60 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-500 via-pink-500 to-blue-500 rounded-full transition-all duration-700" style={{ width: `${levelInfo.progress}%` }} />
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5">{userStats?.glow_points || 0} XP • {levelInfo.nextLevelPoints - (userStats?.glow_points || 0)} XP to next level</p>
      </GlassCard>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile icon={<Icons.CheckCircle className="w-5 h-5 text-emerald-500" />} label="Completed" value={stats.completed} />
        <StatTile icon={<Icons.Zap className="w-5 h-5 text-violet-500" fill="currentColor" />} label="XP Earned" value={`+${stats.xp}`} />
        <StatTile icon={<Icons.Clock className="w-5 h-5 text-blue-500" />} label="Self-care min" value={stats.minutes} />
        <StatTile icon={<Icons.Flame className="w-5 h-5 text-orange-500" fill="currentColor" />} label="Best streak" value={`${userStats?.longest_streak || 0}d`} />
      </div>

      {/* Activity Heatmap */}
      <GlassCard className="p-5">
        <h2 className="text-base font-bold text-gray-800 dark:text-purple-100 mb-3">Activity Heatmap</h2>
        <div className="flex flex-wrap gap-1.5">
          {activity.map((a) => {
            const intensity = a.count / maxCount;
            const bg = a.count === 0 ? 'bg-gray-100 dark:bg-slate-700/50' : intensity > 0.66 ? 'bg-pink-500' : intensity > 0.33 ? 'bg-pink-400' : 'bg-pink-200 dark:bg-pink-900/40';
            return (
              <div key={a.date} className={`w-7 h-7 rounded-lg ${bg} transition-all`} title={`${a.date}: ${a.count}`} />
            );
          })}
        </div>
        <div className="flex items-center justify-end gap-1.5 mt-3">
          <span className="text-[10px] text-gray-400">Less</span>
          <div className="w-3 h-3 rounded bg-gray-100 dark:bg-slate-700/50" />
          <div className="w-3 h-3 rounded bg-pink-200 dark:bg-pink-900/40" />
          <div className="w-3 h-3 rounded bg-pink-400" />
          <div className="w-3 h-3 rounded bg-pink-500" />
          <span className="text-[10px] text-gray-400">More</span>
        </div>
      </GlassCard>

      {/* Bar chart */}
      <GlassCard className="p-5">
        <h2 className="text-base font-bold text-gray-800 dark:text-purple-100 mb-3">Daily Completions</h2>
        <div className="flex items-end justify-between gap-1 h-32">
          {activity.slice(-7).map((a) => {
            const h = Math.max(8, (a.count / maxCount) * 100);
            return (
              <div key={a.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-lg bg-gradient-to-t from-violet-500 to-pink-400 transition-all duration-500" style={{ height: `${h}%` }} />
                <span className="text-[9px] text-gray-400">{new Date(a.date + 'T12:00').toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Favorite category */}
      {stats.favoriteCat && (
        <GlassCard className="p-5">
          <h2 className="text-base font-bold text-gray-800 dark:text-purple-100 mb-3">Most Completed Category</h2>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl ${catColors[stats.favoriteCat]} flex items-center justify-center shadow-md`}>
              <Icons.Heart className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <p className="text-lg font-bold text-gray-800 dark:text-purple-100 capitalize">{stats.favoriteCat.replace('-', ' ')}</p>
          </div>
        </GlassCard>
      )}

      {stats.completed === 0 && (
        <EmptyState icon={<Icons.TrendingUp className="w-7 h-7 text-violet-300" />} title="No activity yet" subtitle="Complete challenges to see your progress bloom." />
      )}
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-2 mb-1.5">{icon}<span className="text-xs font-semibold text-gray-500 dark:text-purple-300/70">{label}</span></div>
      <p className="text-2xl font-bold text-gray-800 dark:text-purple-100">{value}</p>
    </GlassCard>
  );
}
