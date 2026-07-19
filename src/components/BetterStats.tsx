import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserStats } from '../lib/statsUtils';

interface BetterStatsProps {
  userId: string;
  userStats: UserStats | null;
}

type Period = 'week' | 'month';

interface StatsData {
  completed: number;
  xpEarned: number;
  activeDays: number;
  totalDays: number;
  completionPct: number;
  avgStreak: number;
  favoriteCategory: string | null;
  totalMinutes: number;
  bestDay: number;
  bestDayDate: string | null;
}

export function BetterStats({ userId, userStats }: BetterStatsProps) {
  const [period, setPeriod] = useState<Period>('week');
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [userId, period]);

  async function loadStats() {
    const days = period === 'week' ? 7 : 30;
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const { data: progress } = await supabase
      .from('user_progress')
      .select('completed_at, challenges(category, glow_points, duration_minutes)')
      .eq('user_id', userId)
      .gte('completed_at', start.toISOString());

    const items = (progress || []) as unknown as Array<{
      completed_at: string;
      challenges: { category: string; glow_points: number; duration_minutes: number } | null;
    }>;

    const dayMap: Record<string, { count: number; xp: number; minutes: number }> = {};
    const catCount: Record<string, number> = {};

    items.forEach((p) => {
      const date = p.completed_at.split('T')[0];
      if (!dayMap[date]) dayMap[date] = { count: 0, xp: 0, minutes: 0 };
      dayMap[date].count++;
      dayMap[date].xp += p.challenges?.glow_points || 0;
      dayMap[date].minutes += p.challenges?.duration_minutes || 0;
      const cat = p.challenges?.category;
      if (cat) catCount[cat] = (catCount[cat] || 0) + 1;
    });

    const activeDays = Object.keys(dayMap).length;
    const completed = items.length;
    const xpEarned = items.reduce((s, p) => s + (p.challenges?.glow_points || 0), 0);
    const totalMinutes = items.reduce((s, p) => s + (p.challenges?.duration_minutes || 0), 0);
    const completionPct = Math.round((activeDays / days) * 100);
    const avgStreak = userStats ? Math.round(((userStats.current_streak + userStats.longest_streak) / 2) * 10) / 10 : 0;

    let bestDay = 0;
    let bestDayDate: string | null = null;
    Object.entries(dayMap).forEach(([date, d]) => {
      if (d.count > bestDay) {
        bestDay = d.count;
        bestDayDate = date;
      }
    });

    const favoriteCategory = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    setData({
      completed,
      xpEarned,
      activeDays,
      totalDays: days,
      completionPct,
      avgStreak,
      favoriteCategory,
      totalMinutes,
      bestDay,
      bestDayDate,
    });
    setLoading(false);
  }

  if (loading || !data) {
    return (
      <div className="bg-white dark:bg-slate-800/60 rounded-3xl shadow-xl border-2 border-violet-100 dark:border-purple-900/40 p-6 flex items-center justify-center h-48">
        <Icons.Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  const catConfig: Record<string, { label: string; color: string }> = {
    beauty: { label: 'Beauty', color: 'text-pink-500' },
    'self-care': { label: 'Self-Care', color: 'text-emerald-500' },
    mindset: { label: 'Mindset', color: 'text-amber-500' },
    health: { label: 'Health', color: 'text-blue-500' },
  };

  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-3xl shadow-xl border-2 border-violet-100 dark:border-purple-900/40 p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg">
            <Icons.BarChart3 className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-purple-100">Statistics</h3>
            <p className="text-sm text-gray-500 dark:text-purple-300/70">Track your self-care journey</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(['week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                period === p
                  ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-slate-700/40 text-gray-500 dark:text-purple-300/70'
              }`}
            >
              {p === 'week' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatTile icon={<Icons.CheckCircle className="w-5 h-5 text-emerald-500" />} label="Completed" value={data.completed} bg="bg-emerald-50 dark:bg-emerald-900/20" />
        <StatTile icon={<Icons.Zap className="w-5 h-5 text-violet-500" fill="currentColor" />} label="XP Earned" value={`+${data.xpEarned}`} bg="bg-violet-50 dark:bg-violet-900/20" />
        <StatTile icon={<Icons.Clock className="w-5 h-5 text-blue-500" />} label="Self-care min" value={data.totalMinutes} bg="bg-blue-50 dark:bg-blue-900/20" />
        <StatTile icon={<Icons.Flame className="w-5 h-5 text-orange-500" />} label="Avg streak" value={`${data.avgStreak}d`} bg="bg-orange-50 dark:bg-orange-900/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-violet-100 dark:border-purple-900/40">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Completion Rate</p>
          <div className="flex items-end justify-between mb-2">
            <span className="text-3xl font-bold text-violet-600 dark:text-purple-200">{data.completionPct}%</span>
            <span className="text-xs text-gray-400">{data.activeDays}/{data.totalDays} active days</span>
          </div>
          <div className="h-2.5 bg-white dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-700" style={{ width: `${data.completionPct}%` }} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-900/40">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Personal Record</p>
          <div className="flex items-center gap-2">
            <Icons.Trophy className="w-6 h-6 text-amber-500" />
            <div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-300">{data.bestDay} challenges</p>
              {data.bestDayDate && (
                <p className="text-xs text-gray-400">
                  {new Date(data.bestDayDate + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border border-pink-100 dark:border-pink-900/40">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Favorite Category</p>
          {data.favoriteCategory ? (
            <div className="flex items-center gap-2">
              <Icons.Heart className={`w-6 h-6 ${catConfig[data.favoriteCategory]?.color}`} fill="currentColor" />
              <p className="text-2xl font-bold text-pink-600 dark:text-pink-300">{catConfig[data.favoriteCategory]?.label}</p>
            </div>
          ) : <p className="text-sm text-gray-400">No data yet</p>}
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-100 dark:border-cyan-900/40">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Longest Streak</p>
          <div className="flex items-center gap-2">
            <Icons.Flame className="w-6 h-6 text-orange-500" fill="currentColor" />
            <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-300">{userStats?.longest_streak || 0} days</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string | number; bg: string }) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl ${bg}`}>
      {icon}
      <div>
        <p className="text-xl font-bold text-gray-800 dark:text-purple-100">{value}</p>
        <p className="text-xs text-gray-500 dark:text-purple-300/60">{label}</p>
      </div>
    </div>
  );
}
