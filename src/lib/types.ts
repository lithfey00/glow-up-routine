export type Mood = 'happy' | 'calm' | 'tired' | 'stressed' | 'sad' | 'motivated';

export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export type TimeBudget = 5 | 15 | 30 | 60;

export type BuddyStage = 'seed' | 'sprout' | 'plant' | 'flower' | 'tree';

export type FocusSound = 'rain' | 'forest' | 'ocean' | 'cafe' | 'lofi';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export interface MoodLog {
  id: string;
  user_id: string;
  mood: Mood;
  energy: number;
  notes: string | null;
  logged_at: string;
}

export interface WellnessTracker {
  id: string;
  user_id: string;
  date: string;
  water_glasses: number;
  sleep_hours: number;
  exercise_min: number;
  meditation_min: number;
  reading_min: number;
  skincare_done: boolean;
  updated_at: string;
}

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  time_of_day: TimeOfDay;
  is_active: boolean;
  created_at: string;
  routine_items?: RoutineItem[];
}

export interface RoutineItem {
  id: string;
  routine_id: string;
  challenge_id: string;
  sort_order: number;
  challenges?: import('./supabase').Challenge;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  title: string | null;
  content: string | null;
  photo_url: string | null;
  mood: string | null;
  created_at: string;
}

export interface DailyRewardClaim {
  id: string;
  user_id: string;
  claim_date: string;
  reward_type: 'daily' | 'mystery' | 'bonus';
  glow_points_awarded: number;
  created_at: string;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: 'theme' | 'wallpaper' | 'avatar' | 'icon' | 'buddy_skin' | 'decoration';
  price: number;
  icon: string;
  preview_gradient: string;
  created_at: string;
}

export interface UserShopItem {
  id: string;
  user_id: string;
  shop_item_id: string;
  purchased_at: string;
  is_equipped: boolean;
}

export interface FocusSession {
  id: string;
  user_id: string;
  sound: FocusSound;
  duration_min: number;
  started_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  scheduled_for: string;
  is_read: boolean;
  created_at: string;
}

export const MOOD_CONFIG: Record<Mood, { label: string; emoji: string; gradient: string; bg: string; ring: string }> = {
  happy: { label: 'Happy', emoji: '😊', gradient: 'from-amber-300 to-yellow-400', bg: 'bg-amber-50', ring: 'ring-amber-300' },
  calm: { label: 'Calm', emoji: '😌', gradient: 'from-teal-300 to-cyan-400', bg: 'bg-teal-50', ring: 'ring-teal-300' },
  tired: { label: 'Tired', emoji: '😴', gradient: 'from-indigo-300 to-blue-400', bg: 'bg-indigo-50', ring: 'ring-indigo-300' },
  stressed: { label: 'Stressed', emoji: '😣', gradient: 'from-rose-300 to-red-400', bg: 'bg-rose-50', ring: 'ring-rose-300' },
  sad: { label: 'Sad', emoji: '🥺', gradient: 'from-blue-300 to-sky-400', bg: 'bg-blue-50', ring: 'ring-blue-300' },
  motivated: { label: 'Motivated', emoji: '💪', gradient: 'from-emerald-300 to-green-400', bg: 'bg-emerald-50', ring: 'ring-emerald-300' },
};

export const BUDDY_STAGES: { stage: BuddyStage; name: string; minXp: number; icon: string }[] = [
  { stage: 'seed', name: 'Seed', minXp: 0, icon: 'sprout' },
  { stage: 'sprout', name: 'Sprout', minXp: 100, icon: 'leaf' },
  { stage: 'plant', name: 'Plant', minXp: 300, icon: 'flower' },
  { stage: 'flower', name: 'Flower', minXp: 700, icon: 'flower-2' },
  { stage: 'tree', name: 'Tree', minXp: 1500, icon: 'tree-pine' },
];

export function getBuddyStage(xp: number): { stage: BuddyStage; name: string; nextXp: number | null; progress: number } {
  let current = BUDDY_STAGES[0];
  let next: typeof BUDDY_STAGES[number] | null = null;
  for (let i = 0; i < BUDDY_STAGES.length; i++) {
    if (xp >= BUDDY_STAGES[i].minXp) {
      current = BUDDY_STAGES[i];
      next = BUDDY_STAGES[i + 1] || null;
    }
  }
  const nextXp = next ? next.minXp : null;
  const progress = next
    ? Math.min(100, ((xp - current.minXp) / (next.minXp - current.minXp)) * 100)
    : 100;
  return { stage: current.stage, name: current.name, nextXp, progress };
}

export const FOCUS_SOUNDS: { sound: FocusSound; label: string; icon: string; gradient: string }[] = [
  { sound: 'rain', label: 'Rain', icon: 'cloud-rain', gradient: 'from-blue-400 to-cyan-400' },
  { sound: 'forest', label: 'Forest', icon: 'trees', gradient: 'from-emerald-400 to-green-400' },
  { sound: 'ocean', label: 'Ocean', icon: 'waves', gradient: 'from-cyan-400 to-teal-400' },
  { sound: 'cafe', label: 'Cafe', icon: 'coffee', gradient: 'from-amber-400 to-orange-400' },
  { sound: 'lofi', label: 'Lo-fi', icon: 'music', gradient: 'from-violet-400 to-purple-400' },
];
