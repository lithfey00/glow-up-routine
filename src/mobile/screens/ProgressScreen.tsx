import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { useMobileApp } from '../context/MobileAppContext';
import { GlassCard, Skeleton, EmptyState, ProgressBar, Pill } from '../components/ui';
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
    beauty: 'from-pink-400 to-rose-400', 'self-care': 'from-emerald-400 to-teal-400', mindset: 'from-amber-400 to-orange-400', health: 'from-blue-400 to-cyan-400',
  };

  return (
    <div className="px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-28 space-y-5 animate-page-enter">
      <h1 className="text-[28px] font-bold text-gray-800 dark:text-purple-100 font-quicksand tracking-tight">Progress</h1>

      {/* Period toggle */}
      <div className="flex gap-2">
        {(['week', 'month'] as Period[]).map((p) => (
          <Pill key={p} active={period === p} onClick={() => setPeriod(p)}>
            {p === 'week' ? 'This Week' : 'This Month'}
          </Pill>
        ))}
      </div>

      {/* Level hero */}
      <GlassCard variant="sheen" className="p-5 animate-fade-in bg-gradient-to-br from-violet-50/80 to-pink-50/80 dark:from-purple-900/20 dark:to-pink-900/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] text-gray-500 dark:text-purple-300/60 font-semibold uppercase tracking-wide">Current Level</p>
            <p className="text-[24px] font-bold text-gray-800 dark:text-purple-100 font-quicksand leading-tight">Level {levelInfo.level}</p>
            <p className="text-[13px] text-gray-400 dark:text-purple-300/50">{levelInfo.name}</p>
          </div>
          <div className="w-14 h-14 rounded-[22px] bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/30 animate-breathe">
            <Icons.Star className="w-7 h-7 text-white" fill="currentColor" />
          </div>
        </div>
        <ProgressBar value={levelInfo.progress} height="h-3" />
        <p className="text-[11px] text-gray-400 mt-2 font-medium">{userStats?.glow_points || 0} XP · {levelInfo.nextLevelPoints - (userStats?.glow_points || 0)} XP to next level</p>
      </GlassCard>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile icon={<Icons.CheckCircle className="w-5 h-5 text-emerald-500" />} label="Completed" value={stats.completed} gradient="from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20" delay={0} />
        <StatTile icon={<Icons.Zap className="w-5 h-5 text-violet-500" fill="currentColor" />} label="XP Earned" value={`+${stats.xp}`} gradient="from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20" delay={0.05} />
        <StatTile icon={<Icons.Clock className="w-5 h-5 text-blue-500" />} label="Self-care min" value={stats.minutes} gradient="from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20" delay={0.1} />
        <StatTile icon={<Icons.Flame className="w-5 h-5 text-orange-500" fill="currentColor" />} label="Best streak" value={`${userStats?.longest_streak || 0}d`} gradient="from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20" delay={0.15} />
      </div>

      {/* Activity Heatmap */}
      <GlassCard className="p-5 animate-fade-in stagger-2">
        <h2 className="text-[17px] font-bold text-gray-800 dark:text-purple-100 font-quicksand mb-4">Activity Heatmap</h2>
        <div className="flex flex-wrap gap-1.5">
          {activity.map((a) => {
            const intensity = a.count / maxCount;
            const bg = a.count === 0 ? 'bg-gray-100 dark:bg-slate-700/40' : intensity > 0.66 ? 'bg-gradient-to-br from-pink-500 to-violet-500' : intensity > 0.33 ? 'bg-pink-400' : 'bg-pink-200 dark:bg-pink-900/40';
            return (
              <div key={a.date} className={`w-7 h-7 rounded-[8px] ${bg} transition-all duration-500 hover:scale-110`} title={`${a.date}: ${a.count}`} />
            );
          })}
        </div>
        <div className="flex items-center justify-end gap-1.5 mt-4">
          <span className="text-[10px] text-gray-400 font-medium">Less</span>
          <div className="w-3 h-3 rounded bg-gray-100 dark:bg-slate-700/40" />
          <div className="w-3 h-3 rounded bg-pink-200 dark:bg-pink-900/40" />
          <div className="w-3 h-3 rounded bg-pink-400" />
          <div className="w-3 h-3 rounded bg-gradient-to-br from-pink-500 to-violet-500" />
          <span className="text-[10px] text-gray-400 font-medium">More</span>
        </div>
      </GlassCard>

      {/* Bar chart */}
      <GlassCard className="p-5 animate-fade-in stagger-3">
        <h2 className="text-[17px] font-bold text-gray-800 dark:text-purple-100 font-quicksand mb-4">Daily Completions</h2>
        <div className="flex items-end justify-between gap-1.5 h-32">
          {activity.slice(-7).map((a) => {
            const h = Math.max(8, (a.count / maxCount) * 100);
            return (
              <div key={a.date} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full rounded-t-[10px] bg-gradient-to-t from-violet-500 to-pink-400 transition-all duration-700 ease-out" style={{ height: `${h}%` }} />
                <span className="text-[9px] text-gray-400 font-medium">{new Date(a.date + 'T12:00').toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Favorite category */}
      {stats.favoriteCat && (
        <GlassCard className="p-5 animate-fade-in stagger-4">
          <h2 className="text-[17px] font-bold text-gray-800 dark:text-purple-100 font-quicksand mb-3">Most Completed</h2>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-[20px] bg-gradient-to-br ${catColors[stats.favoriteCat]} flex items-center justify-center shadow-md`}>
              <Icons.Heart className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <p className="text-[18px] font-bold text-gray-800 dark:text-purple-100 capitalize font-quicksand">{stats.favoriteCat.replace('-', ' ')}</p>
          </div>
        </GlassCard>
      )}

      {stats.completed === 0 && (
        <EmptyState emoji="🌱" title="No activity yet" subtitle="Complete challenges to see your progress bloom." />
      )}
    </div>
  );
}

function StatTile({ icon, label, value, gradient }: { icon: React.ReactNode; label: string; value: string | number; gradient: string; delay?: number }) {
  return (
    <GlassCard className={`p-4 animate-fade-in bg-gradient-to-br ${gradient}`} >
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-[11px] font-semibold text-gray-500 dark:text-purple-300/60 uppercase tracking-wide">{label}</span></div>
      <p className="text-[24px] font-bold text-gray-800 dark:text-purple-100 font-quicksand leading-none">{value}</p>
    </GlassCard>
  );
}
