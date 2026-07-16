import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Reward } from '../lib/supabase';
import type { UserStats } from '../lib/statsUtils';

interface ProgressHistoryProps {
  userId: string;
  userStats: UserStats | null;
  rewards: Reward[];
  unlockedRewardIds: Set<string>;
  currentLevel: number;
}

interface DayData {
  date: string;
  count: number;
  isToday: boolean;
}

interface CategoryTotals {
  beauty: number;
  'self-care': number;
  mindset: number;
  health: number;
}

const DAYS = 28;

function getCellStyle(count: number, isToday: boolean): string {
  const base = 'aspect-square rounded-md transition-all duration-200 cursor-default';
  const ring = isToday ? ' ring-2 ring-offset-1 ring-violet-400' : '';
  const hover = count > 0 ? ' hover:scale-110' : ' hover:bg-gray-200';
  if (count === 0) return `${base} bg-gray-100 border border-gray-200${ring}${hover}`;
  if (count <= 2) return `${base} bg-pink-200${ring}${hover}`;
  if (count <= 4) return `${base} bg-pink-400${ring}${hover}`;
  return `${base} bg-gradient-to-br from-pink-500 to-violet-500${ring}${hover}`;
}

const categoryConfig = {
  beauty: { label: 'Beauty', gradient: 'from-pink-400 to-rose-400', bg: 'bg-pink-50', text: 'text-pink-600' },
  'self-care': { label: 'Self-Care', gradient: 'from-emerald-400 to-teal-400', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  mindset: { label: 'Mindset', gradient: 'from-amber-400 to-orange-400', bg: 'bg-amber-50', text: 'text-amber-600' },
  health: { label: 'Health', gradient: 'from-blue-400 to-cyan-400', bg: 'bg-blue-50', text: 'text-blue-600' },
};

const rewardTypeIcons: Record<string, keyof typeof Icons> = {
  theme: 'Palette',
  avatar: 'User',
  badge_border: 'Award',
  challenge_pack: 'Package',
  confetti: 'PartyPopper',
};

export function ProgressHistory({
  userId,
  userStats,
  rewards,
  unlockedRewardIds,
  currentLevel,
}: ProgressHistoryProps) {
  const [history, setHistory] = useState<DayData[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotals>({ beauty: 0, 'self-care': 0, mindset: 0, health: 0 });
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  useEffect(() => {
    loadHistory();
  }, [userId]);

  async function loadHistory() {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (DAYS - 1));
    startDate.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('user_progress')
      .select('completed_at, challenges(category)')
      .eq('user_id', userId)
      .gte('completed_at', startDate.toISOString());

    if (error) {
      console.error('Error loading history:', error);
      setLoading(false);
      return;
    }

    const dateMap: Record<string, number> = {};
    const cats: CategoryTotals = { beauty: 0, 'self-care': 0, mindset: 0, health: 0 };

    data?.forEach((item) => {
      const date = item.completed_at.split('T')[0];
      dateMap[date] = (dateMap[date] || 0) + 1;
      const cat = (item.challenges as { category: string } | null)?.category;
      if (cat && cat in cats) cats[cat as keyof CategoryTotals]++;
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const days: DayData[] = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({ date: dateStr, count: dateMap[dateStr] || 0, isToday: dateStr === todayStr });
    }

    setHistory(days);
    setCategoryTotals(cats);
    setLoading(false);
  }

  // Split 28 days into 4 rows of 7
  const weeks: DayData[][] = [0, 1, 2, 3].map((w) => history.slice(w * 7, w * 7 + 7));

  // Week-day labels for first week (use actual weekday names)
  const weekdayLabels =
    history.length >= 7
      ? history.slice(0, 7).map((d) =>
          new Date(d.date + 'T12:00:00').toLocaleDateString('nl-NL', { weekday: 'short' })
        )
      : ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];

  const totalCompleted = history.reduce((s, d) => s + d.count, 0);
  const activeDays = history.filter((d) => d.count > 0).length;
  const bestDay = Math.max(...history.map((d) => d.count), 0);
  const maxCategoryCount = Math.max(...Object.values(categoryTotals), 1);

  // Next reward
  const sortedRewards = [...rewards].sort((a, b) => a.required_level - b.required_level);
  const nextReward = sortedRewards.find((r) => !unlockedRewardIds.has(r.id) && r.required_level > currentLevel);
  const prevMilestoneLvl = nextReward
    ? sortedRewards
        .filter((r) => unlockedRewardIds.has(r.id) || r.required_level <= currentLevel)
        .reduce((max, r) => Math.max(max, r.required_level), 0)
    : 0;
  const rewardProgress = nextReward
    ? Math.min(
        100,
        ((currentLevel - prevMilestoneLvl) / Math.max(1, nextReward.required_level - prevMilestoneLvl)) * 100
      )
    : 100;
  const levelsLeft = nextReward ? nextReward.required_level - currentLevel : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex items-center justify-center h-48">
        <Icons.Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      {/* ── Header ─────────────────────────────── */}
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-md">
              <Icons.CalendarDays className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Activiteitenkaart</h3>
              <p className="text-sm text-gray-500">Laatste 4 weken</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{totalCompleted}</div>
              <div className="text-xs text-gray-500">voltooid</div>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{activeDays}</div>
              <div className="text-xs text-gray-500">actieve dagen</div>
            </div>
          </div>
        </div>

        {/* ── Heatmap ────────────────────────────── */}
        <div className="mb-3">
          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {weekdayLabels.map((label, i) => (
              <div key={i} className="text-center text-xs font-medium text-gray-400">
                {label}
              </div>
            ))}
          </div>

          {/* Week rows */}
          <div className="space-y-1.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1.5">
                {week.map((day) => (
                  <div
                    key={day.date}
                    className="relative group"
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    <div className={getCellStyle(day.count, day.isToday)} />

                    {/* Tooltip */}
                    {hoveredDay?.date === day.date && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none">
                        <div className="bg-gray-900 text-white text-xs rounded-xl px-3 py-2 whitespace-nowrap shadow-2xl">
                          <div className="font-semibold mb-0.5">
                            {new Date(day.date + 'T12:00:00').toLocaleDateString('nl-NL', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </div>
                          <div className="text-gray-300">
                            {day.count === 0
                              ? 'Geen activiteit'
                              : `${day.count} challenge${day.count !== 1 ? 's' : ''}`}
                          </div>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-gray-400">Minder</span>
            <div className="flex gap-1">
              {['bg-gray-100', 'bg-pink-200', 'bg-pink-400', 'bg-pink-500'].map((cls, i) => (
                <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
              ))}
            </div>
            <span className="text-xs text-gray-400">Meer</span>
          </div>
        </div>

        {/* ── Stats row ──────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 py-5 border-t border-b border-gray-100">
          <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-xl">
            <Icons.Flame className="w-4 h-4 text-orange-500 flex-shrink-0" />
            <div>
              <div className="text-lg font-bold text-gray-800 leading-none">{userStats?.current_streak || 0}</div>
              <div className="text-xs text-gray-500 mt-0.5">Streak</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-xl">
            <Icons.Target className="w-4 h-4 text-violet-500 flex-shrink-0" />
            <div>
              <div className="text-lg font-bold text-gray-800 leading-none">{userStats?.perfect_days || 0}</div>
              <div className="text-xs text-gray-500 mt-0.5">Perfect</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-pink-50 rounded-xl">
            <Icons.TrendingUp className="w-4 h-4 text-pink-500 flex-shrink-0" />
            <div>
              <div className="text-lg font-bold text-gray-800 leading-none">{bestDay}</div>
              <div className="text-xs text-gray-500 mt-0.5">Beste dag</div>
            </div>
          </div>
        </div>

        {/* ── Category bars ──────────────────────── */}
        <div className="py-5 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Categorie verdeling (28 dagen)</p>
          <div className="space-y-2.5">
            {(Object.entries(categoryConfig) as [keyof typeof categoryConfig, typeof categoryConfig[keyof typeof categoryConfig]][]).map(
              ([cat, cfg]) => {
                const count = categoryTotals[cat];
                const pct = totalCompleted > 0 ? (count / totalCompleted) * 100 : 0;
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <div className={`text-xs font-semibold w-16 text-right ${cfg.text} flex-shrink-0`}>{cfg.label}</div>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${cfg.gradient} rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-xs font-bold text-gray-600 w-5 text-right flex-shrink-0">{count}</div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* ── Next Reward Progress ───────────────── */}
      {nextReward ? (
        <div className="p-6 pt-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Volgende beloning</p>
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-violet-50 to-pink-50 rounded-2xl border border-violet-100">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg flex-shrink-0">
              {(() => {
                const iconName = rewardTypeIcons[nextReward.reward_type] || 'Gift';
                const IconComp = (Icons[iconName as keyof typeof Icons] as typeof Icons.Gift) || Icons.Gift;
                return <IconComp className="w-6 h-6 text-white" strokeWidth={2} />;
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-bold text-gray-800 text-sm">{nextReward.name}</p>
                  <p className="text-xs text-gray-500">{nextReward.description}</p>
                </div>
                <div className="flex-shrink-0 ml-3 text-right">
                  <span className="text-xs font-bold text-violet-700 bg-violet-100 px-2 py-1 rounded-full whitespace-nowrap">
                    Lvl {nextReward.required_level}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-700"
                    style={{ width: `${rewardProgress}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-500 flex-shrink-0">
                  {levelsLeft} lvl{levelsLeft !== 1 ? 's' : ''} te gaan
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 pt-4">
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
            <Icons.Trophy className="w-8 h-8 text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-gray-800 text-sm">Alle beloningen vrijgespeeld!</p>
              <p className="text-xs text-gray-500">Je hebt alles bereikt. Jij bent een echte Glow Legend!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
