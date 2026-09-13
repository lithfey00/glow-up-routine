import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase, type Challenge, type Reward, type MascotState } from '../../lib/supabase';
import {
  type UserStats,
  type Achievement,
  updateUserStats,
  checkAndUnlockAchievements,
  checkAndUnlockRewards,
  updateMascotState,
  getLevelInfo,
  getMascotMood,
} from '../../lib/statsUtils';
import { triggerConfetti } from '../../lib/confetti';
import { haptic } from '../lib/haptics';
import { hasOnboarded, getOnboardingPrefs, type OnboardingPrefs } from '../components/Onboarding';
import type { CelebrationData } from '../components/CelebrationModal';

interface MobileAppContextValue {
  sessionId: string;
  challenges: Challenge[];
  completedToday: Set<string>;
  userStats: UserStats | null;
  mascot: MascotState | null;
  achievements: Achievement[];
  unlockedAchievements: Set<string>;
  rewards: Reward[];
  unlockedRewardIds: Set<string>;
  buddyXp: number;
  loading: boolean;
  loadError: boolean;
  showOnboarding: boolean;
  prefs: OnboardingPrefs | null;
  celebration: CelebrationData | null;
  toggleChallenge: (challengeId: string) => Promise<void>;
  completeChallenge: (challengeId: string) => Promise<void>;
  refresh: () => Promise<void>;
  dismissOnboarding: () => void;
  dismissCelebration: () => void;
  toast: { message: string; type: 'achievement' | 'reward' | 'level' | 'coins' } | null;
  showToast: (message: string, type?: 'achievement' | 'reward' | 'level' | 'coins') => void;
}

const MobileAppContext = createContext<MobileAppContextValue | undefined>(undefined);

const SESSION_KEY = 'glow-session-id';

function getSessionId(): string {
  if (typeof window === 'undefined') return 'session-anonymous';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function MobileAppProvider({ children }: { children: ReactNode }) {
  const sessionId = useMemo(() => getSessionId(), []);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [mascot, setMascot] = useState<MascotState | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [unlockedRewardIds, setUnlockedRewardIds] = useState<Set<string>>(new Set());
  const [buddyXp, setBuddyXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [toast, setToast] = useState<MobileAppContextValue['toast']>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [prefs, setPrefs] = useState<OnboardingPrefs | null>(null);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);

  const showToast = useCallback((message: string, type: 'achievement' | 'reward' | 'level' | 'coins' = 'achievement') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    if (!hasOnboarded()) {
      setShowOnboarding(true);
    }
    setPrefs(getOnboardingPrefs());
  }, []);

  const loadAll = useCallback(async () => {
    setLoadError(false);
    const [ch, stats, masc, ach, userAch, rew, userRew, progress] = await Promise.all([
      supabase.from('challenges').select('*').order('category'),
      supabase.from('user_stats').select('*').eq('user_id', sessionId).maybeSingle(),
      supabase.from('mascot_state').select('*').eq('user_id', sessionId).maybeSingle(),
      supabase.from('achievements').select('*'),
      supabase.from('user_achievements').select('achievement_id').eq('user_id', sessionId),
      supabase.from('rewards').select('*'),
      supabase.from('user_rewards').select('reward_id').eq('user_id', sessionId),
      supabase.from('user_progress').select('challenge_id, completed_at').eq('user_id', sessionId),
    ]);

    const failed = [ch, stats, masc, ach, userAch, rew, userRew, progress].some((r) => r.error);
    if (failed) {
      console.error('Data load failed');
      setLoadError(true);
      setLoading(false);
      return;
    }

    setChallenges((ch.data || []) as Challenge[]);
    setUserStats((stats.data as UserStats) || null);
    setMascot((masc.data as MascotState) || null);
    setAchievements((ach.data || []) as Achievement[]);
    setUnlockedAchievements(new Set((userAch.data || []).map((a) => (a as { achievement_id: string }).achievement_id)));
    setRewards((rew.data || []) as Reward[]);
    setUnlockedRewardIds(new Set((userRew.data || []).map((r) => (r as { reward_id: string }).reward_id)));
    setBuddyXp((masc.data as MascotState | null)?.glow_energy || (stats.data as UserStats | null)?.glow_points || 0);

    const today = new Date().toISOString().split('T')[0];
    setCompletedToday(new Set(
      (progress.data || [])
        .filter((p) => (p as { completed_at: string }).completed_at.startsWith(today))
        .map((p) => (p as { challenge_id: string }).challenge_id)
    ));
    setLoading(false);
  }, [sessionId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const toggleChallenge = useCallback(async (challengeId: string) => {
    const challenge = challenges.find((c) => c.id === challengeId);
    if (!challenge) return;
    const wasCompleted = completedToday.has(challengeId);

    if (wasCompleted) {
      const { error } = await supabase.from('user_progress').delete().eq('user_id', sessionId).eq('challenge_id', challengeId);
      if (error) { showToast('Could not update progress. Try again.', 'coins'); return; }
      setCompletedToday((prev) => { const n = new Set(prev); n.delete(challengeId); return n; });
    } else {
      const { error } = await supabase.from('user_progress').insert({
        user_id: sessionId,
        challenge_id: challengeId,
        completed_at: new Date().toISOString(),
      });
      if (error) { showToast('Could not save progress. Try again.', 'coins'); return; }
      setCompletedToday((prev) => new Set([...prev, challengeId]));
    }

    // Recompute stats
    const { data: allProgress } = await supabase
      .from('user_progress')
      .select('challenge_id, completed_at, challenges(category, glow_points, duration_minutes)')
      .eq('user_id', sessionId);
    const total = allProgress?.length || 0;
    const today = new Date().toISOString().split('T')[0];
    const todayCount = (allProgress || []).filter((p) => (p as { completed_at: string }).completed_at.startsWith(today)).length;

    const glowDelta = wasCompleted ? -challenge.glow_points : challenge.glow_points;
    const streakBonus = (userStats?.current_streak || 0) > 0
      ? Math.floor(challenge.glow_points * 0.2 * Math.min(userStats?.current_streak || 0, 10))
      : 0;
    const totalGlowDelta = wasCompleted ? glowDelta : glowDelta + streakBonus;

    const stats = await updateUserStats(sessionId, todayCount, total, totalGlowDelta, false);
    if (stats) {
      const prevLevel = getLevelInfo(userStats?.glow_points || 0).level;
      setUserStats(stats);
      setBuddyXp((prev) => Math.max(0, prev + (wasCompleted ? -challenge.glow_points : challenge.glow_points)));

      if (stats.level > prevLevel) {
        showToast(`Level ${stats.level} reached!`, 'level');
        const newRewards = await checkAndUnlockRewards(sessionId, stats.level);
        if (newRewards.length) {
          const { data: userRew } = await supabase.from('user_rewards').select('reward_id').eq('user_id', sessionId);
          setUnlockedRewardIds(new Set((userRew || []).map((r) => (r as { reward_id: string }).reward_id)));
          showToast(`${newRewards.length} new reward(s) unlocked!`, 'reward');
        }
      }

      const categoryStats: Record<string, number> = {};
      (allProgress || []).forEach((p) => {
        const ch = (p as unknown as { challenges: { category: string } | null }).challenges;
        if (ch?.category) categoryStats[ch.category] = (categoryStats[ch.category] || 0) + 1;
      });

      const newAch = await checkAndUnlockAchievements(sessionId, stats, categoryStats, wasCompleted ? null : new Date().getHours(), null, !wasCompleted);
      if (newAch.length) {
        const { data: userAch } = await supabase.from('user_achievements').select('achievement_id').eq('user_id', sessionId);
        setUnlockedAchievements(new Set((userAch || []).map((a) => (a as { achievement_id: string }).achievement_id)));
        const names = achievements.filter((a) => newAch.includes(a.id)).map((a) => a.name);
        showToast(`New badge: ${names.join(', ')}`, 'achievement');
      }

      const mood = getMascotMood(mascot?.evolution_stage || 'egg', todayCount, newAch.length > 0);
      const updatedMascot = await updateMascotState(sessionId, totalGlowDelta, mood, stats.level);
      if (updatedMascot) setMascot(updatedMascot);
    }
  }, [challenges, completedToday, sessionId, userStats, mascot, achievements, showToast]);

  const completeChallenge = useCallback(async (challengeId: string) => {
    const challenge = challenges.find((c) => c.id === challengeId);
    if (!challenge) return;
    const wasCompleted = completedToday.has(challengeId);
    if (wasCompleted) return;

    const { error } = await supabase.from('user_progress').insert({
      user_id: sessionId,
      challenge_id: challengeId,
      completed_at: new Date().toISOString(),
    });
    if (error) { showToast('Could not save progress. Try again.', 'coins'); return; }

    triggerConfetti(30);
    haptic('success');
    setCompletedToday((prev) => new Set([...prev, challengeId]));

    // Recompute stats
    const { data: allProgress } = await supabase
      .from('user_progress')
      .select('challenge_id, completed_at, challenges(category, glow_points, duration_minutes)')
      .eq('user_id', sessionId);
    const total = allProgress?.length || 0;
    const today = new Date().toISOString().split('T')[0];
    const todayCount = (allProgress || []).filter((p) => (p as { completed_at: string }).completed_at.startsWith(today)).length;

    const glowDelta = challenge.glow_points;
    const streakBonus = (userStats?.current_streak || 0) > 0
      ? Math.floor(challenge.glow_points * 0.2 * Math.min(userStats?.current_streak || 0, 10))
      : 0;
    const totalGlowDelta = glowDelta + streakBonus;
    const xpEarned = totalGlowDelta;

    const stats = await updateUserStats(sessionId, todayCount, total, totalGlowDelta, false);
    let levelUp = false;
    let newLevel: number | null = null;

    if (stats) {
      const prevLevel = getLevelInfo(userStats?.glow_points || 0).level;
      setUserStats(stats);
      const newBuddyXp = Math.max(0, buddyXp + challenge.glow_points);
      setBuddyXp(newBuddyXp);

      if (stats.level > prevLevel) {
        levelUp = true;
        newLevel = stats.level;
        const newRewards = await checkAndUnlockRewards(sessionId, stats.level);
        if (newRewards.length) {
          const { data: userRew } = await supabase.from('user_rewards').select('reward_id').eq('user_id', sessionId);
          setUnlockedRewardIds(new Set((userRew || []).map((r) => (r as { reward_id: string }).reward_id)));
        }
      }

      const categoryStats: Record<string, number> = {};
      (allProgress || []).forEach((p) => {
        const ch = (p as unknown as { challenges: { category: string } | null }).challenges;
        if (ch?.category) categoryStats[ch.category] = (categoryStats[ch.category] || 0) + 1;
      });

      const newAch = await checkAndUnlockAchievements(sessionId, stats, categoryStats, new Date().getHours(), null, true);
      if (newAch.length) {
        const { data: userAch } = await supabase.from('user_achievements').select('achievement_id').eq('user_id', sessionId);
        setUnlockedAchievements(new Set((userAch || []).map((a) => (a as { achievement_id: string }).achievement_id)));
        const names = achievements.filter((a) => newAch.includes(a.id)).map((a) => a.name);
        showToast(`New badge: ${names.join(', ')}`, 'achievement');
      }

      const mood = getMascotMood(mascot?.evolution_stage || 'egg', todayCount, newAch.length > 0);
      const updatedMascot = await updateMascotState(sessionId, totalGlowDelta, mood, stats.level);
      if (updatedMascot) setMascot(updatedMascot);

      // Compute celebration data
      const stageInfo = getStageFromXpLocal(newBuddyXp);
      setCelebration({
        challengeTitle: challenge.title,
        xpEarned,
        totalXp: stats.glow_points,
        buddyXp: newBuddyXp,
        buddyStage: stageInfo.name,
        nextStageName: stageInfo.nextName,
        xpUntilNextStage: stageInfo.xpUntilNext,
        levelUp,
        newLevel,
      });
    }
  }, [challenges, completedToday, sessionId, userStats, buddyXp, mascot, achievements, showToast]);

  const refresh = useCallback(() => loadAll(), [loadAll]);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    setPrefs(getOnboardingPrefs());
  }, []);

  const dismissCelebration = useCallback(() => {
    setCelebration(null);
  }, []);

  const value: MobileAppContextValue = {
    sessionId, challenges, completedToday, userStats, mascot,
    achievements, unlockedAchievements, rewards, unlockedRewardIds,
    buddyXp, loading, loadError, showOnboarding, prefs, celebration,
    toggleChallenge, completeChallenge, refresh, dismissOnboarding, dismissCelebration,
    toast, showToast,
  };

  return <MobileAppContext.Provider value={value}>{children}</MobileAppContext.Provider>;
}

function getStageFromXpLocal(xp: number): { name: string; nextName: string | null; xpUntilNext: number | null } {
  const STAGES = [
    { name: 'Seed', minXp: 0 },
    { name: 'Sprout', minXp: 100 },
    { name: 'Plant', minXp: 300 },
    { name: 'Flower', minXp: 700 },
    { name: 'Tree', minXp: 1500 },
  ];
  let current = STAGES[0];
  let next: typeof STAGES[number] | null = null;
  for (let i = 0; i < STAGES.length; i++) {
    if (xp >= STAGES[i].minXp) {
      current = STAGES[i];
      next = STAGES[i + 1] || null;
    }
  }
  return {
    name: current.name,
    nextName: next ? next.name : null,
    xpUntilNext: next ? next.minXp - xp : null,
  };
}

export function useMobileApp() {
  const ctx = useContext(MobileAppContext);
  if (!ctx) throw new Error('useMobileApp must be used within MobileAppProvider');
  return ctx;
}
