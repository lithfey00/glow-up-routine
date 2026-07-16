import { useEffect, useState, useCallback } from 'react';
import { supabase, Challenge, Reward, MascotState } from './lib/supabase';
import { ChallengeCard } from './components/ChallengeCard';
import { StatsCard } from './components/StatsCard';
import { DailyPicker } from './components/DailyPicker';
import { AchievementModal } from './components/AchievementModal';
import { RewardsModal } from './components/RewardsModal';
import { ProgressHistory } from './components/ProgressHistory';
import { StarDragon } from './components/StarDragon';
import { WeeklySummary } from './components/WeeklySummary';
import { triggerConfetti } from './lib/confetti';
import {
  UserStats,
  Achievement,
  updateUserStats,
  checkAndUnlockAchievements,
  checkAndUnlockRewards,
  getMascotMood,
  updateMascotState,
  getLevelInfo,
  getLevelName,
} from './lib/statsUtils';
import * as Icons from 'lucide-react';

type CategoryFilter = 'all' | 'beauty' | 'self-care' | 'mindset' | 'health';

function App() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [dailyChallenges, setDailyChallenges] = useState<Challenge[]>([]);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [loading, setLoading] = useState(true);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());
  const [showAchievements, setShowAchievements] = useState(false);
  const [showDailyPicker, setShowDailyPicker] = useState(true);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [unlockedRewardIds, setUnlockedRewardIds] = useState<Set<string>>(new Set());
  const [showRewards, setShowRewards] = useState(false);
  const [mascot, setMascot] = useState<MascotState | null>(null);
  const [newAchievementCount, setNewAchievementCount] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'achievement' | 'reward' | 'level' } | null>(null);

  const loadAchievements = useCallback(async () => {
    const { data: allAchievements } = await supabase.from('achievements').select('*');
    setAchievements(allAchievements || []);

    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', sessionId);

    setUnlockedAchievements(new Set(userAchievements?.map((ua) => ua.achievement_id) || []));
  }, [sessionId]);

  useEffect(() => {
    loadChallenges();
    loadProgress();
    loadAchievements();
    loadUserStats();
    loadRewards();
    loadMascot();
  }, [loadAchievements]);

  useEffect(() => {
    if (challenges.length > 0 && dailyChallenges.length === 0) {
      pickDailyChallenges();
    }
  }, [challenges]);

  const showToast = useCallback((message: string, type: 'achievement' | 'reward' | 'level') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleSecretFound = useCallback(async () => {
    const { data: secretAchievement } = await supabase
      .from('achievements')
      .select('id')
      .eq('name', 'Secret Finder')
      .maybeSingle();

    if (!secretAchievement) return;

    const { data: existing } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', sessionId)
      .eq('achievement_id', secretAchievement.id)
      .maybeSingle();

    if (existing) return;

    await supabase.from('user_achievements').insert({
      user_id: sessionId,
      achievement_id: secretAchievement.id,
      unlocked_at: new Date().toISOString(),
    });

    await loadAchievements();
    setNewAchievementCount((prev) => prev + 1);
    setTimeout(() => setNewAchievementCount(0), 5000);
    showToast('Geheim ontdekt: Secret Finder badge!', 'achievement');
    triggerConfetti(80);
  }, [sessionId, showToast, loadAchievements]);

  async function loadChallenges() {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      console.error('Error loading challenges:', error);
    } else {
      setChallenges(data || []);
    }
    setLoading(false);
  }

  async function loadProgress() {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('user_progress')
      .select('challenge_id, completed_at')
      .eq('user_id', sessionId)
      .gte('completed_at', `${today}T00:00:00`)
      .lte('completed_at', `${today}T23:59:59`);

    if (error) {
      console.error('Error loading progress:', error);
    } else {
      setCompletedToday(new Set(data?.map((p) => p.challenge_id) || []));
    }
  }

  async function loadUserStats() {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', sessionId)
      .maybeSingle();

    if (!error && data) {
      setUserStats(data);
    }
  }

  async function loadRewards() {
    const { data: allRewards } = await supabase.from('rewards').select('*');
    setRewards(allRewards || []);

    const { data: userRewards } = await supabase
      .from('user_rewards')
      .select('reward_id')
      .eq('user_id', sessionId);

    setUnlockedRewardIds(new Set(userRewards?.map((ur) => ur.reward_id) || []));
  }

  async function loadMascot() {
    const { data, error } = await supabase
      .from('mascot_state')
      .select('*')
      .eq('user_id', sessionId)
      .maybeSingle();

    if (!error && data) {
      setMascot(data);
    }
  }

  function pickDailyChallenges() {
    const categories: Challenge[][] = [[], [], [], []];
    challenges.forEach((c) => {
      if (c.category === 'beauty') categories[0].push(c);
      else if (c.category === 'self-care') categories[1].push(c);
      else if (c.category === 'mindset') categories[2].push(c);
      else if (c.category === 'health') categories[3].push(c);
    });

    const picks: Challenge[] = [];
    categories.forEach((cat) => {
      if (cat.length > 0) {
        const randomIndex = Math.floor(Math.random() * cat.length);
        picks.push(cat[randomIndex]);
      }
    });

    setDailyChallenges(picks);
  }

  async function toggleChallenge(challengeId: string) {
    const challenge = challenges.find((c) => c.id === challengeId);
    if (!challenge) return;

    const wasCompleted = completedToday.has(challengeId);
    const completedHour = new Date().getHours();

    if (wasCompleted) {
      const { error } = await supabase
        .from('user_progress')
        .delete()
        .eq('user_id', sessionId)
        .eq('challenge_id', challengeId);

      if (!error) {
        setCompletedToday((prev) => {
          const newSet = new Set(prev);
          newSet.delete(challengeId);
          return newSet;
        });
      }
    } else {
      const { error } = await supabase.from('user_progress').insert({
        user_id: sessionId,
        challenge_id: challengeId,
        completed_at: new Date().toISOString(),
      });

      if (!error) {
        setCompletedToday((prev) => new Set([...prev, challengeId]));
        triggerConfetti(30);
      }
    }

    await updateStatsAndAchievements(challenge.glow_points, wasCompleted, completedHour);
  }

  async function updateStatsAndAchievements(
    challengeGlowPoints: number,
    wasUncompleting: boolean,
    completedHour: number
  ) {
    const { data: allProgress } = await supabase
      .from('user_progress')
      .select('challenge_id, completed_at')
      .eq('user_id', sessionId);

    const totalCompleted = allProgress?.length || 0;

    const today = new Date().toISOString().split('T')[0];
    const { data: todayProgress } = await supabase
      .from('user_progress')
      .select('challenge_id')
      .eq('user_id', sessionId)
      .gte('completed_at', `${today}T00:00:00`);

    const completedTodayCount = todayProgress?.length || 0;

    const dailyPickIds = new Set(dailyChallenges.map((c) => c.id));
    const todayChallengeIds = new Set(todayProgress?.map((p) => p.challenge_id) || []);
    const isPerfectDay = completedTodayCount > 0 && dailyPickIds.size > 0 &&
      [...dailyPickIds].every((id) => todayChallengeIds.has(id));

    const currentStreak = userStats?.current_streak || 0;
    const glowDelta = wasUncompleting ? -challengeGlowPoints : challengeGlowPoints;
    const streakBonus = currentStreak > 0 ? Math.floor(challengeGlowPoints * 0.2 * Math.min(currentStreak, 10)) : 0;
    const totalGlowDelta = wasUncompleting ? glowDelta : glowDelta + streakBonus + (isPerfectDay ? 100 : 0);

    const stats = await updateUserStats(
      sessionId,
      completedTodayCount,
      totalCompleted,
      totalGlowDelta,
      isPerfectDay
    );

    if (stats) {
      const prevLevel = getLevelInfo(userStats?.glow_points || 0).level;
      setUserStats(stats);

      if (stats.level > prevLevel) {
        showToast(`Level ${stats.level} bereikt! Je bent nu een ${getLevelName(stats.level)}!`, 'level');
        triggerConfetti(80);
        const newRewards = await checkAndUnlockRewards(sessionId, stats.level);
        if (newRewards.length > 0) {
          await loadRewards();
          showToast(`${newRewards.length} nieuwe beloning(en) vrijgespeeld!`, 'reward');
        }
      }

      const categoryStats: Record<string, number> = {
        beauty: 0,
        'self-care': 0,
        mindset: 0,
        health: 0,
      };

      allProgress?.forEach((p) => {
        const challenge = challenges.find((c) => c.id === p.challenge_id);
        if (challenge) {
          categoryStats[challenge.category] = (categoryStats[challenge.category] || 0) + 1;
        }
      });

      const lastGapDays = null;
      const newAchievementIds = await checkAndUnlockAchievements(
        sessionId,
        stats,
        categoryStats,
        wasUncompleting ? null : completedHour,
        lastGapDays,
        !wasUncompleting
      );

      if (newAchievementIds.length > 0) {
        await loadAchievements();
        setNewAchievementCount((prev) => prev + newAchievementIds.length);
        setTimeout(() => setNewAchievementCount(0), 5000);
        const { data: freshAchievements } = await supabase.from('achievements').select('*');
        const names = (freshAchievements || [])
          .filter((a: Achievement) => newAchievementIds.includes(a.id))
          .map((a: Achievement) => a.name);
        showToast(`Nieuwe badge: ${names.join(', ')}!`, 'achievement');
        triggerConfetti(60);
      }

      const mood = getMascotMood(
        mascot?.evolution_stage || 'egg',
        completedTodayCount,
        newAchievementIds.length > 0
      );
      const updatedMascot = await updateMascotState(sessionId, totalGlowDelta, mood, stats.level);
      if (updatedMascot) {
        setMascot(updatedMascot);
      }
    }
  }

  const filteredChallenges =
    selectedCategory === 'all'
      ? challenges
      : challenges.filter((c) => c.category === selectedCategory);

  const stats = {
    total: completedToday.size,
    beauty: challenges.filter((c) => c.category === 'beauty' && completedToday.has(c.id)).length,
    selfCare: challenges.filter((c) => c.category === 'self-care' && completedToday.has(c.id)).length,
    mindset: challenges.filter((c) => c.category === 'mindset' && completedToday.has(c.id)).length,
    health: challenges.filter((c) => c.category === 'health' && completedToday.has(c.id)).length,
  };

  const totalMinutes = challenges
    .filter((c) => completedToday.has(c.id))
    .reduce((sum, c) => sum + c.duration_minutes, 0);

  const levelInfo = getLevelInfo(userStats?.glow_points || 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-violet-50 to-blue-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Icons.Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
          <span className="text-xl font-semibold text-gray-700">Loading your glow up journey...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-violet-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-violet-500 rounded-3xl shadow-xl mb-6">
            <Icons.Sparkles className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-600 via-violet-600 to-blue-600 bg-clip-text text-transparent mb-3">
            Glow Up Routine
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Daily mini-challenges to elevate your beauty, self-care, mindset, and health
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatsCard
            icon="Target"
            label="Completed Today"
            value={stats.total}
            gradient="from-pink-500 to-rose-500"
          />
          <StatsCard
            icon="Clock"
            label="Minutes Invested"
            value={totalMinutes}
            gradient="from-violet-500 to-pink-500"
          />
          <StatsCard
            icon="Flame"
            label="Current Streak"
            value={`${userStats?.current_streak || 0} days`}
            gradient="from-orange-500 to-red-500"
          />
          <button
            onClick={() => setShowAchievements(true)}
            className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-xl transition-all hover:scale-105"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg relative">
                <Icons.Award className="w-6 h-6 text-white" strokeWidth={2.5} />
                {unlockedAchievements.size > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                    {unlockedAchievements.size}
                  </div>
                )}
              </div>
              <div className="text-left">
                <div className="text-3xl font-bold text-gray-800">{unlockedAchievements.size}</div>
                <div className="text-sm font-medium text-gray-500">Badges</div>
              </div>
            </div>
          </button>
          <button
            onClick={() => setShowRewards(true)}
            className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-xl transition-all hover:scale-105"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg relative">
                <Icons.Gift className="w-6 h-6 text-white" strokeWidth={2.5} />
                {unlockedRewardIds.size > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                    {unlockedRewardIds.size}
                  </div>
                )}
              </div>
              <div className="text-left">
                <div className="text-3xl font-bold text-gray-800">{unlockedRewardIds.size}</div>
                <div className="text-sm font-medium text-gray-500">Rewards</div>
              </div>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <StarDragon
              mascot={mascot}
              completedToday={stats.total}
              levelName={levelInfo.name}
              level={levelInfo.level}
              glowPoints={userStats?.glow_points || 0}
              hasNewAchievement={newAchievementCount > 0}
              onSecretFound={handleSecretFound}
            />
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-6 h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                  <Icons.TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Glow Points & Level</h3>
                  <p className="text-sm text-gray-500">Je voortgang naar glow greatness</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                    {userStats?.glow_points || 0}
                  </span>
                  <span className="text-sm font-medium text-gray-500">Glow Points</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-100 to-pink-100 rounded-full">
                  <Icons.Star className="w-4 h-4 text-violet-600" fill="currentColor" />
                  <span className="font-bold text-violet-700">Level {levelInfo.level}</span>
                  <span className="text-violet-500">|</span>
                  <span className="font-semibold text-violet-600">{levelInfo.name}</span>
                </div>
              </div>

              <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 via-pink-500 to-blue-500 rounded-full transition-all duration-700"
                  style={{ width: `${levelInfo.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{levelInfo.minPoints} XP</span>
                <span>{levelInfo.nextLevelPoints} XP</span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-xl">
                  <Icons.Flame className="w-5 h-5 text-orange-500" />
                  <div>
                    <div className="text-lg font-bold text-gray-800">{userStats?.current_streak || 0}</div>
                    <div className="text-xs text-gray-500">Day Streak</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
                  <Icons.Target className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="text-lg font-bold text-gray-800">{userStats?.perfect_days || 0}</div>
                    <div className="text-xs text-gray-500">Perfect Days</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showDailyPicker && dailyChallenges.length > 0 && (
          <div className="mb-8">
            <DailyPicker
              dailyChallenges={dailyChallenges}
              completedToday={completedToday}
              onToggle={toggleChallenge}
              onRefresh={pickDailyChallenges}
            />
          </div>
        )}

        <div className="mb-8">
          <WeeklySummary
            userId={sessionId}
            userStats={userStats}
            mascot={mascot}
            onViewBadges={() => setShowAchievements(true)}
          />
        </div>

        <div className="mb-8">
          <ProgressHistory
            userId={sessionId}
            userStats={userStats}
            rewards={rewards}
            unlockedRewardIds={unlockedRewardIds}
            currentLevel={levelInfo.level}
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">All Challenges</h2>
          <button
            onClick={() => setShowDailyPicker(!showDailyPicker)}
            className="px-4 py-2 bg-white rounded-xl text-sm font-semibold text-gray-700 hover:shadow-md transition-all"
          >
            {showDailyPicker ? 'Hide' : 'Show'} Daily Picks
          </button>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          {(['all', 'beauty', 'self-care', 'mindset', 'health'] as const).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-white text-gray-800 shadow-lg scale-105'
                  : 'bg-white/60 text-gray-600 hover:bg-white/80 hover:shadow-md'
              }`}
            >
              {category === 'all' ? 'All Challenges' : category.charAt(0).toUpperCase() + category.slice(1)}
              {category !== 'all' && (
                <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                  {category === 'self-care'
                    ? stats.selfCare
                    : stats[category as keyof typeof stats]}
                </span>
              )}
            </button>
          ))}
        </div>

        {filteredChallenges.length === 0 ? (
          <div className="text-center py-20">
            <Icons.SearchX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">No challenges found in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                isCompleted={completedToday.has(challenge.id)}
                onToggle={() => toggleChallenge(challenge.id)}
              />
            ))}
          </div>
        )}

        {dailyChallenges.length > 0 && dailyChallenges.every((c) => completedToday.has(c.id)) && (
          <div className="mt-12 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 rounded-3xl p-8 text-center shadow-2xl">
            <Icons.Trophy className="w-16 h-16 text-white mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Perfect Day!</h2>
            <p className="text-white/90 text-lg">
              You've completed all daily challenges today. +100 XP bonus! You're glowing!
            </p>
          </div>
        )}
      </div>

      {showAchievements && (
        <AchievementModal
          achievements={achievements}
          unlockedAchievements={unlockedAchievements}
          onClose={() => setShowAchievements(false)}
        />
      )}

      {showRewards && (
        <RewardsModal
          rewards={rewards}
          unlockedRewardIds={unlockedRewardIds}
          currentLevel={levelInfo.level}
          onClose={() => setShowRewards(false)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-2 ${
              toast.type === 'achievement'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-300'
                : toast.type === 'reward'
                ? 'bg-gradient-to-r from-violet-500 to-pink-500 border-violet-300'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 border-blue-300'
            }`}
          >
            {toast.type === 'achievement' && <Icons.Award className="w-6 h-6 text-white" />}
            {toast.type === 'reward' && <Icons.Gift className="w-6 h-6 text-white" />}
            {toast.type === 'level' && <Icons.Star className="w-6 h-6 text-white" fill="currentColor" />}
            <p className="text-white font-semibold text-sm">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
