import { useEffect, useState } from 'react';
import { supabase, Challenge } from './lib/supabase';
import { ChallengeCard } from './components/ChallengeCard';
import { StatsCard } from './components/StatsCard';
import { DailyPicker } from './components/DailyPicker';
import { AchievementModal } from './components/AchievementModal';
import { ProgressHistory } from './components/ProgressHistory';
import {
  UserStats,
  Achievement,
  updateUserStats,
  checkAndUnlockAchievements,
  getLevelName,
  getProgressToNextLevel,
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

  useEffect(() => {
    loadChallenges();
    loadProgress();
    loadAchievements();
    loadUserStats();
  }, []);

  useEffect(() => {
    if (challenges.length > 0 && dailyChallenges.length === 0) {
      pickDailyChallenges();
    }
  }, [challenges]);

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
      .select('challenge_id')
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

  async function loadAchievements() {
    const { data: allAchievements } = await supabase.from('achievements').select('*');
    setAchievements(allAchievements || []);

    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', sessionId);

    setUnlockedAchievements(new Set(userAchievements?.map((ua) => ua.achievement_id) || []));
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
    if (completedToday.has(challengeId)) {
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
      }
    }

    await updateStatsAndAchievements();
  }

  async function updateStatsAndAchievements() {
    const { data: allProgress } = await supabase
      .from('user_progress')
      .select('challenge_id')
      .eq('user_id', sessionId);

    const totalCompleted = allProgress?.length || 0;

    const { data: todayProgress } = await supabase
      .from('user_progress')
      .select('challenge_id')
      .eq('user_id', sessionId)
      .gte('completed_at', new Date().toISOString().split('T')[0]);

    const completedTodayCount = todayProgress?.length || 0;

    const stats = await updateUserStats(sessionId, completedTodayCount, totalCompleted);
    if (stats) {
      setUserStats(stats);

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

      await checkAndUnlockAchievements(sessionId, stats, categoryStats);
      await loadAchievements();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Icons.Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
          <span className="text-xl font-semibold text-gray-700">Loading your glow up journey...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-3xl shadow-xl mb-6">
            <Icons.Sparkles className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
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
            gradient="from-purple-500 to-pink-500"
          />
          <StatsCard
            icon="Flame"
            label="Current Streak"
            value={`${userStats?.current_streak || 0} days`}
            gradient="from-orange-500 to-red-500"
          />
          <StatsCard
            icon="TrendingUp"
            label="Level"
            value={getLevelName(userStats?.level || 1)}
            gradient="from-blue-500 to-cyan-500"
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
                <div className="text-sm font-medium text-gray-500">Achievements</div>
              </div>
            </div>
          </button>
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
          <ProgressHistory userId={sessionId} />
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

        {stats.total === challenges.length && challenges.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-3xl p-8 text-center shadow-2xl">
            <Icons.Trophy className="w-16 h-16 text-white mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Amazing Work!</h2>
            <p className="text-white/90 text-lg">
              You've completed all challenges today. You're glowing!
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
    </div>
  );
}

export default App;
