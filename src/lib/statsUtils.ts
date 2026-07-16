import { supabase } from './supabase';
import type { MascotState } from './supabase';

export type UserStats = {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  total_completed: number;
  level: number;
  glow_points: number;
  perfect_days: number;
  last_perfect_day: string | null;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: 'streak' | 'total' | 'category' | 'level' | 'perfect_day' | 'time_of_day' | 'comeback' | 'points';
  requirement_value: number;
  category: string | null;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'secret';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirement_subtype: string | null;
  created_at: string;
};

export type UserAchievement = {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  created_at: string;
};

export type LevelInfo = {
  level: number;
  name: string;
  icon: string;
  minPoints: number;
  nextLevelPoints: number;
  progress: number;
};

// Each tier spans a range of levels. minPoints is the total XP needed to enter tier level 1.
// Within a tier, each level costs pointsPerLevel XP.
const TIERS = [
  { name: 'Seed', icon: 'sprout', startLevel: 1, endLevel: 3, startPoints: 0, pointsPerLevel: 35 },
  { name: 'Bloom', icon: 'flower', startLevel: 4, endLevel: 6, startPoints: 100, pointsPerLevel: 70 },
  { name: 'Blossom', icon: 'flower-2', startLevel: 7, endLevel: 9, startPoints: 300, pointsPerLevel: 100 },
  { name: 'Radiant', icon: 'sparkles', startLevel: 10, endLevel: 14, startPoints: 600, pointsPerLevel: 80 },
  { name: 'Diamond', icon: 'gem', startLevel: 15, endLevel: 19, startPoints: 1000, pointsPerLevel: 200 },
  { name: 'Glow Queen/King', icon: 'crown', startLevel: 20, endLevel: 29, startPoints: 2000, pointsPerLevel: 300 },
  { name: 'Cosmic Legend', icon: 'crown', startLevel: 30, endLevel: Infinity, startPoints: 5000, pointsPerLevel: 1000 },
];

function getTierForLevel(level: number) {
  return TIERS.find((t) => level >= t.startLevel && level <= t.endLevel) || TIERS[0];
}

function getMinPointsForLevel(level: number): number {
  const tier = getTierForLevel(level);
  return tier.startPoints + (level - tier.startLevel) * tier.pointsPerLevel;
}

export function getLevelFromPoints(glowPoints: number): number {
  let level = 1;
  for (const tier of TIERS) {
    const maxLevel = tier.endLevel === Infinity ? tier.startLevel + Math.floor((glowPoints - tier.startPoints) / tier.pointsPerLevel) : tier.endLevel;
    for (let l = tier.startLevel; l <= maxLevel; l++) {
      const needed = tier.startPoints + (l - tier.startLevel) * tier.pointsPerLevel;
      if (glowPoints >= needed) {
        level = l;
      } else {
        return level;
      }
    }
  }
  return level;
}

export function getLevelInfo(glowPoints: number): LevelInfo {
  const level = getLevelFromPoints(glowPoints);
  const tier = getTierForLevel(level);
  const minPoints = getMinPointsForLevel(level);
  const nextLevelPoints = minPoints + tier.pointsPerLevel;
  const progress = Math.min(100, ((glowPoints - minPoints) / tier.pointsPerLevel) * 100);

  return {
    level,
    name: tier.name,
    icon: tier.icon,
    minPoints,
    nextLevelPoints,
    progress: Math.max(0, progress),
  };
}

export function getLevelName(level: number): string {
  return getTierForLevel(level).name;
}

export function calculateGlowPoints(
  basePoints: number,
  currentStreak: number,
  isPerfectDay: boolean
): number {
  const streakBonus = currentStreak > 0 ? Math.floor(basePoints * 0.2 * Math.min(currentStreak, 10)) : 0;
  const perfectDayBonus = isPerfectDay ? 100 : 0;
  return basePoints + streakBonus + perfectDayBonus;
}

export function getMascotStageFromLevel(level: number): MascotState['evolution_stage'] {
  if (level >= 50) return 'legendary';
  if (level >= 30) return 'cosmic';
  if (level >= 15) return 'glowing';
  if (level >= 5) return 'baby';
  return 'egg';
}

export function getMascotMood(
  _stage: MascotState['evolution_stage'],
  completedToday: number,
  hasNewAchievement: boolean
): MascotState['mood'] {
  if (hasNewAchievement) return 'excited';
  if (completedToday === 0) return 'sleeping';
  if (completedToday >= 4) return 'proud';
  if (completedToday >= 1) return 'encouraging';
  return 'happy';
}

export async function updateUserStats(
  userId: string,
  completedToday: number,
  totalCompletedAllTime: number,
  glowPointsDelta: number,
  isPerfectDay: boolean
): Promise<UserStats | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data: existingStats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  let currentStreak = 1;
  let longestStreak = 1;
  let glowPoints = glowPointsDelta;
  let perfectDays = isPerfectDay ? 1 : 0;

  if (existingStats) {
    const lastActivityDate = existingStats.last_activity_date;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastActivityDate === yesterdayStr) {
      currentStreak = existingStats.current_streak + 1;
    } else if (lastActivityDate === today) {
      currentStreak = existingStats.current_streak;
    } else {
      currentStreak = 1;
    }

    longestStreak = Math.max(currentStreak, existingStats.longest_streak);
    glowPoints = existingStats.glow_points + glowPointsDelta;

    if (isPerfectDay) {
      if (existingStats.last_perfect_day === today) {
        perfectDays = existingStats.perfect_days;
      } else {
        perfectDays = existingStats.perfect_days + 1;
      }
    } else {
      perfectDays = existingStats.perfect_days;
    }
  }

  const level = getLevelFromPoints(glowPoints);

  const statsData = {
    user_id: userId,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    total_completed: totalCompletedAllTime,
    level,
    glow_points: glowPoints,
    perfect_days: perfectDays,
    last_perfect_day: isPerfectDay ? today : existingStats?.last_perfect_day || null,
    last_activity_date: completedToday > 0 ? today : existingStats?.last_activity_date,
    updated_at: new Date().toISOString(),
  };

  if (existingStats) {
    const { data, error } = await supabase
      .from('user_stats')
      .update(statsData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating stats:', error);
      return null;
    }
    return data;
  } else {
    const { data, error } = await supabase
      .from('user_stats')
      .insert(statsData)
      .select()
      .single();

    if (error) {
      console.error('Error creating stats:', error);
      return null;
    }
    return data;
  }
}

function getAchievementId(
  achievements: Achievement[] | null,
  name: string
): string | null {
  const found = achievements?.find((a) => a.name === name);
  return found?.id || null;
}

export async function checkAndUnlockAchievements(
  userId: string,
  stats: UserStats,
  categoryStats: Record<string, number>,
  completedAtHours: number | null,
  lastGapDays: number | null,
  luckyRoll = false
): Promise<string[]> {
  const { data: allAchievements } = await supabase.from('achievements').select('*');

  const { data: unlockedAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);

  const unlockedIds = new Set(unlockedAchievements?.map((ua) => ua.achievement_id) || []);
  const toUnlock: string[] = [];

  allAchievements?.forEach((achievement: Achievement) => {
    if (unlockedIds.has(achievement.id)) return;

    let shouldUnlock = false;

    switch (achievement.requirement_type) {
      case 'total':
        shouldUnlock = stats.total_completed >= achievement.requirement_value;
        break;
      case 'streak':
        shouldUnlock = stats.current_streak >= achievement.requirement_value;
        break;
      case 'level':
        shouldUnlock = stats.level >= achievement.requirement_value;
        break;
      case 'category':
        if (achievement.category) {
          shouldUnlock = (categoryStats[achievement.category] || 0) >= achievement.requirement_value;
        }
        break;
      case 'perfect_day':
        shouldUnlock = stats.perfect_days >= achievement.requirement_value;
        break;
      case 'time_of_day':
        if (achievement.requirement_subtype === 'night' && completedAtHours !== null) {
          shouldUnlock = completedAtHours >= 22 || completedAtHours < 4;
        } else if (achievement.requirement_subtype === 'morning' && completedAtHours !== null) {
          shouldUnlock = completedAtHours < 8;
        }
        break;
      case 'comeback':
        shouldUnlock = lastGapDays !== null && lastGapDays >= achievement.requirement_value;
        break;
      case 'points':
        shouldUnlock = stats.glow_points >= achievement.requirement_value;
        break;
    }

    if (shouldUnlock) {
      toUnlock.push(achievement.id);
    }
  });

  if (luckyRoll && !unlockedIds.has(getAchievementId(allAchievements, 'Lucky Day'))) {
    if (Math.random() < 0.005) {
      const luckyId = getAchievementId(allAchievements, 'Lucky Day');
      if (luckyId) toUnlock.push(luckyId);
    }
  }

  if (toUnlock.length > 0) {
    await supabase.from('user_achievements').insert(
      toUnlock.map((achievementId) => ({
        user_id: userId,
        achievement_id: achievementId,
        unlocked_at: new Date().toISOString(),
      }))
    );
  }

  return toUnlock;
}

export async function checkAndUnlockRewards(userId: string, level: number): Promise<string[]> {
  const { data: allRewards } = await supabase.from('rewards').select('*');

  const { data: userRewards } = await supabase
    .from('user_rewards')
    .select('reward_id')
    .eq('user_id', userId);

  const unlockedIds = new Set(userRewards?.map((ur) => ur.reward_id) || []);
  const toUnlock: string[] = [];

  allRewards?.forEach((reward) => {
    if (!unlockedIds.has(reward.id) && level >= reward.required_level) {
      toUnlock.push(reward.id);
    }
  });

  if (toUnlock.length > 0) {
    await supabase.from('user_rewards').insert(
      toUnlock.map((rewardId) => ({
        user_id: userId,
        reward_id: rewardId,
        unlocked_at: new Date().toISOString(),
      }))
    );
  }

  return toUnlock;
}

export async function updateMascotState(
  userId: string,
  glowEnergyDelta: number,
  mood: MascotState['mood'],
  level: number
): Promise<MascotState | null> {
  const { data: existing } = await supabase
    .from('mascot_state')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const newEnergy = (existing?.glow_energy || 0) + glowEnergyDelta;
  const newStage = getMascotStageFromLevel(level);
  const now = new Date().toISOString();

  if (existing) {
    const { data, error } = await supabase
      .from('mascot_state')
      .update({
        glow_energy: newEnergy,
        evolution_stage: newStage,
        mood,
        last_interaction: now,
        updated_at: now,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating mascot:', error);
      return null;
    }
    return data;
  } else {
    const { data, error } = await supabase
      .from('mascot_state')
      .insert({
        user_id: userId,
        glow_energy: newEnergy,
        evolution_stage: newStage,
        mood,
        last_interaction: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating mascot:', error);
      return null;
    }
    return data;
  }
}
