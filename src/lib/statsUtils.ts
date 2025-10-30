import { supabase } from './supabase';

export type UserStats = {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  total_completed: number;
  level: number;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: 'streak' | 'total' | 'category' | 'level';
  requirement_value: number;
  category: string | null;
  created_at: string;
};

export type UserAchievement = {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  created_at: string;
};

export function calculateLevel(totalCompleted: number): number {
  return Math.floor(totalCompleted / 10) + 1;
}

export function getLevelName(level: number): string {
  if (level >= 20) return 'Legend';
  if (level >= 15) return 'Master';
  if (level >= 10) return 'Expert';
  if (level >= 7) return 'Advanced';
  if (level >= 5) return 'Intermediate';
  if (level >= 3) return 'Novice';
  return 'Beginner';
}

export function getProgressToNextLevel(totalCompleted: number): number {
  return (totalCompleted % 10) * 10;
}

export async function updateUserStats(
  userId: string,
  completedToday: number,
  totalCompletedAllTime: number
): Promise<UserStats | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data: existingStats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  let currentStreak = 1;
  let longestStreak = 1;

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
  }

  const level = calculateLevel(totalCompletedAllTime);

  const statsData = {
    user_id: userId,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    total_completed: totalCompletedAllTime,
    level,
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

export async function checkAndUnlockAchievements(
  userId: string,
  stats: UserStats,
  categoryStats: Record<string, number>
): Promise<void> {
  const { data: allAchievements } = await supabase.from('achievements').select('*');

  const { data: unlockedAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);

  const unlockedIds = new Set(unlockedAchievements?.map((ua) => ua.achievement_id) || []);

  const toUnlock: string[] = [];

  allAchievements?.forEach((achievement) => {
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
    }

    if (shouldUnlock) {
      toUnlock.push(achievement.id);
    }
  });

  if (toUnlock.length > 0) {
    await supabase.from('user_achievements').insert(
      toUnlock.map((achievementId) => ({
        user_id: userId,
        achievement_id: achievementId,
        unlocked_at: new Date().toISOString(),
      }))
    );
  }
}
