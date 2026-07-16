import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserStats } from '../lib/statsUtils';
import type { MascotState } from '../lib/supabase';

interface WeeklySummaryProps {
  userId: string;
  userStats: UserStats | null;
  mascot: MascotState | null;
  onViewBadges: () => void;
}

interface WeeklyData {
  completedCount: number;
  xpEarned: number;
  categoryBreakdown: Record<string, number>;
  newBadges: string[];
  activeDays: number;
}

const categoryConfig = {
  beauty: { label: 'Beauty', color: 'text-pink-600', bg: 'bg-pink-100', icon: 'sparkles' },
  'self-care': { label: 'Self-Care', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: 'heart' },
  mindset: { label: 'Mindset', color: 'text-amber-600', bg: 'bg-amber-100', icon: 'brain' },
  health: { label: 'Health', color: 'text-blue-600', bg: 'bg-blue-100', icon: 'zap' },
};

export function WeeklySummary({ userId, userStats, mascot, onViewBadges }: WeeklySummaryProps) {
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadWeeklyData();
  }, [userId]);

  async function loadWeeklyData() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [progressResult, badgesResult] = await Promise.all([
      supabase
        .from('user_progress')
        .select('completed_at, challenge_id, challenges(category, glow_points)')
        .eq('user_id', userId)
        .gte('completed_at', sevenDaysAgo.toISOString()),
      supabase
        .from('user_achievements')
        .select('unlocked_at, achievements(name)')
        .eq('user_id', userId)
        .gte('unlocked_at', sevenDaysAgo.toISOString()),
    ]);

    const progress = progressResult.data || [];
    const badges = badgesResult.data || [];

    const xpEarned = progress.reduce((sum, p) => {
      const ch = p.challenges as { glow_points: number } | null;
      return sum + (ch?.glow_points || 0);
    }, 0);

    const categoryBreakdown: Record<string, number> = {};
    progress.forEach((p) => {
      const ch = p.challenges as { category: string } | null;
      if (ch?.category) {
        categoryBreakdown[ch.category] = (categoryBreakdown[ch.category] || 0) + 1;
      }
    });

    const activeDaySet = new Set(progress.map((p) => p.completed_at.split('T')[0]));

    const newBadges = badges
      .map((b) => (b.achievements as { name: string } | null)?.name)
      .filter(Boolean) as string[];

    setWeeklyData({
      completedCount: progress.length,
      xpEarned,
      categoryBreakdown,
      newBadges,
      activeDays: activeDaySet.size,
    });
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 flex items-center gap-3">
        <Icons.Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        <span className="text-sm text-gray-500">Weekoverzicht laden...</span>
      </div>
    );
  }

  if (!weeklyData) return null;

  const streak = userStats?.current_streak || 0;
  const mascotEnergy = mascot?.glow_energy || 0;
  const hasHighlight = weeklyData.newBadges.length > 0 || weeklyData.completedCount >= 10 || streak >= 7;

  return (
    <div
      className={`rounded-2xl shadow-md border overflow-hidden transition-all duration-300 ${
        hasHighlight
          ? 'border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50'
          : 'border-gray-100 bg-white'
      }`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-5 flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
            <Icons.CalendarDays className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <h3 className="text-base font-bold text-gray-800">Deze Week</h3>
            <p className="text-xs text-gray-500">
              {weeklyData.activeDays} actieve dag{weeklyData.activeDays !== 1 ? 'en' : ''} &middot; {weeklyData.completedCount} challenges
            </p>
          </div>
        </div>

        {/* Compact highlights row */}
        <div className="flex items-center gap-3 mr-2">
          <div className="hidden sm:flex items-center gap-1.5 text-orange-600 font-bold text-sm">
            <Icons.Flame className="w-4 h-4" />
            {streak}d
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-violet-600 font-bold text-sm">
            <Icons.Zap className="w-4 h-4" fill="currentColor" />
            {weeklyData.xpEarned} XP
          </div>
          {weeklyData.newBadges.length > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 rounded-full">
              <Icons.Award className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-bold text-amber-700">{weeklyData.newBadges.length}</span>
            </div>
          )}
        </div>

        <div
          className={`w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
            expanded ? 'rotate-180' : ''
          }`}
        >
          <Icons.ChevronDown className="w-4 h-4 text-gray-500" />
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100/80">
          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <StatPill
              icon={<Icons.Flame className="w-4 h-4 text-orange-500" />}
              label="Streak"
              value={`${streak} dagen`}
              bg="bg-orange-50"
            />
            <StatPill
              icon={<Icons.CheckCircle className="w-4 h-4 text-green-500" />}
              label="Voltooid"
              value={`${weeklyData.completedCount}`}
              bg="bg-green-50"
            />
            <StatPill
              icon={<Icons.Zap className="w-4 h-4 text-violet-500" fill="currentColor" />}
              label="XP verdiend"
              value={`+${weeklyData.xpEarned}`}
              bg="bg-violet-50"
            />
            <StatPill
              icon={<Icons.Heart className="w-4 h-4 text-pink-500" fill="currentColor" />}
              label="Mascotte energie"
              value={`${mascotEnergy}`}
              bg="bg-pink-50"
            />
          </div>

          {/* Category breakdown */}
          {Object.keys(weeklyData.categoryBreakdown).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Per categorie</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(weeklyData.categoryBreakdown).map(([cat, count]) => {
                  const cfg = categoryConfig[cat as keyof typeof categoryConfig];
                  if (!cfg) return null;
                  const IconComp = (Icons[cfg.icon as keyof typeof Icons] as typeof Icons.Sparkles) || Icons.Sparkles;
                  return (
                    <div
                      key={cat}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      {cfg.label}: {count}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New badges */}
          {weeklyData.newBadges.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Nieuwe badges</p>
              <div className="flex flex-wrap gap-2">
                {weeklyData.newBadges.map((name) => (
                  <div
                    key={name}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full text-xs font-bold text-amber-700 border border-amber-200"
                  >
                    <Icons.Award className="w-3.5 h-3.5" />
                    {name}
                  </div>
                ))}
              </div>
              <button
                onClick={onViewBadges}
                className="mt-2 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
              >
                Bekijk alle badges →
              </button>
            </div>
          )}

          {/* Motivational message */}
          <div className="pt-1">
            <p className="text-sm text-gray-500 italic">
              {getMotivationalMessage(weeklyData.completedCount, streak, weeklyData.activeDays)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
}) {
  return (
    <div className={`flex items-center gap-2 p-3 rounded-xl ${bg}`}>
      {icon}
      <div>
        <div className="text-base font-bold text-gray-800">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function getMotivationalMessage(completed: number, streak: number, activeDays: number): string {
  if (completed === 0) return 'Nog niets voltooid deze week — begin vandaag!';
  if (streak >= 30) return 'Ongelooflijk! Je bent een echte Glow Legend!';
  if (streak >= 14) return 'Twee weken streak! Je bent onstopbaar!';
  if (streak >= 7) return 'Een week streak! Je gloeit van binnen en buiten!';
  if (activeDays === 7) return 'Perfecte week! Elke dag actief geweest!';
  if (completed >= 20) return 'Waanzinnig actief deze week! Je glow is onmiskenbaar.';
  if (completed >= 10) return 'Geweldige week! Je bouwt mooie gewoontes op.';
  if (activeDays >= 5) return 'Bijna elke dag actief — geweldig bezig!';
  if (completed >= 5) return 'Goede week! Elke kleine stap telt.';
  return 'Je bent begonnen — dat is het belangrijkste!';
}
