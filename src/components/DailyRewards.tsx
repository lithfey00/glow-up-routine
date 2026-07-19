import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { supabase } from '../lib/supabase';
import { triggerConfetti } from '../lib/confetti';

interface DailyRewardsProps {
  userId: string;
  onXpAwarded: (xp: number) => void;
}

interface ClaimRecord {
  claim_date: string;
  reward_type: string;
  glow_points_awarded: number;
}

export function DailyRewards({ userId, onXpAwarded }: DailyRewardsProps) {
  const [, setClaims] = useState<ClaimRecord[]>([]);
  const [todayClaimed, setTodayClaimed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [mysteryAvailable, setMysteryAvailable] = useState(false);
  const [mysteryClaimed, setMysteryClaimed] = useState(false);
  const [mysteryReward, setMysteryReward] = useState<number | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    loadClaims();
  }, [userId]);

  async function loadClaims() {
    const { data } = await supabase
      .from('daily_reward_claims')
      .select('claim_date, reward_type, glow_points_awarded')
      .eq('user_id', userId)
      .order('claim_date', { ascending: false })
      .limit(30);

    const records = (data || []) as ClaimRecord[];
    setClaims(records);

    const today = new Date().toISOString().split('T')[0];
    const todayDaily = records.find((r) => r.claim_date === today && r.reward_type === 'daily');
    setTodayClaimed(!!todayDaily);

    // Calculate login streak from daily claims
    const dailyDates = new Set(records.filter((r) => r.reward_type === 'daily').map((r) => r.claim_date));
    let s = 0;
    const d = new Date();
    while (dailyDates.has(d.toISOString().split('T')[0])) {
      s++;
      d.setDate(d.getDate() - 1);
    }
    setStreak(s);

    // Mystery gift every 7 days of login streak
    const todayMystery = records.find((r) => r.claim_date === today && r.reward_type === 'mystery');
    setMysteryClaimed(!!todayMystery);
    setMysteryAvailable(s > 0 && s % 7 === 0 && !todayMystery);
  }

  async function claimDaily() {
    if (todayClaimed || claiming) return;
    setClaiming(true);
    const reward = 25 + Math.min(streak, 7) * 5;
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('daily_reward_claims').insert({
      user_id: userId,
      claim_date: today,
      reward_type: 'daily',
      glow_points_awarded: reward,
    });
    if (!error) {
      setTodayClaimed(true);
      setStreak((s) => s + 1);
      onXpAwarded(reward);
      triggerConfetti(40);
    }
    setClaiming(false);
  }

  async function claimMystery() {
    if (!mysteryAvailable || mysteryClaimed || claiming) return;
    setClaiming(true);
    const reward = Math.floor(Math.random() * 150) + 100;
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('daily_reward_claims').insert({
      user_id: userId,
      claim_date: today,
      reward_type: 'mystery',
      glow_points_awarded: reward,
    });
    if (!error) {
      setMysteryClaimed(true);
      setMysteryAvailable(false);
      setMysteryReward(reward);
      onXpAwarded(reward);
      triggerConfetti(80);
    }
    setClaiming(false);
  }

  const daysToMystery = streak > 0 ? 7 - (streak % 7 || 7) : 7;

  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-3xl shadow-xl border-2 border-violet-100 dark:border-purple-900/40 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center shadow-lg">
          <Icons.Gift className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-purple-100">Daily Rewards</h3>
          <p className="text-sm text-gray-500 dark:text-purple-300/70">{streak} day login streak</p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-5">
        {Array.from({ length: 7 }).map((_, i) => {
          const day = i + 1;
          const claimed = day <= (streak % 7 || (todayClaimed ? 7 : 0));
          const isToday = day === (streak % 7 || 7) && !todayClaimed;
          const isMystery = day === 7;
          return (
            <div
              key={i}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center border-2 transition-all ${
                claimed
                  ? 'bg-gradient-to-br from-violet-400 to-pink-400 border-transparent text-white shadow-md'
                  : isToday
                  ? 'bg-violet-50 dark:bg-purple-900/30 border-violet-300 dark:border-purple-600 text-violet-600 dark:text-purple-200 animate-glow-pulse'
                  : 'bg-gray-50 dark:bg-slate-700/40 border-gray-100 dark:border-slate-600/40 text-gray-400 dark:text-purple-300/40'
              }`}
            >
              {isMystery ? (
                <Icons.Sparkles className="w-4 h-4" />
              ) : (
                <span className="text-xs font-bold">{day}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={claimDaily}
          disabled={todayClaimed || claiming}
          className={`flex-1 px-5 py-3 rounded-2xl font-semibold text-sm transition-all ${
            todayClaimed
              ? 'bg-gray-100 dark:bg-slate-700/40 text-gray-400 dark:text-purple-300/40 cursor-default'
              : 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-lg hover:scale-105'
          }`}
        >
          {todayClaimed ? (
            <span className="flex items-center justify-center gap-2">
              <Icons.Check className="w-4 h-4" /> Claimed today
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Icons.Sparkles className="w-4 h-4" /> Claim +{25 + Math.min(streak, 7) * 5} XP
            </span>
          )}
        </button>

        <button
          onClick={claimMystery}
          disabled={!mysteryAvailable || mysteryClaimed || claiming}
          className={`flex-1 px-5 py-3 rounded-2xl font-semibold text-sm transition-all ${
            mysteryAvailable && !mysteryClaimed
              ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg hover:scale-105 animate-glow-pulse'
              : 'bg-gray-100 dark:bg-slate-700/40 text-gray-400 dark:text-purple-300/40 cursor-default'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Icons.Sparkles className="w-4 h-4" />
            {mysteryClaimed ? 'Mystery opened' : mysteryAvailable ? 'Open Mystery Gift!' : `Mystery in ${daysToMystery}d`}
          </span>
        </button>
      </div>

      {mysteryReward !== null && (
        <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl text-center animate-badge-pop">
          <p className="text-sm font-bold text-amber-600 dark:text-amber-300">
            Mystery gift: +{mysteryReward} bonus XP!
          </p>
        </div>
      )}
    </div>
  );
}
