import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Challenge = {
  id: string;
  title: string;
  description: string;
  category: 'beauty' | 'self-care' | 'mindset' | 'health';
  duration_minutes: number;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
  glow_points: number;
  created_at: string;
};

export type UserProgress = {
  id: string;
  user_id: string;
  challenge_id: string;
  completed_at: string;
  created_at: string;
};

export type Reward = {
  id: string;
  name: string;
  description: string;
  reward_type: 'theme' | 'avatar' | 'badge_border' | 'challenge_pack' | 'confetti';
  required_level: number;
  icon: string;
  created_at: string;
};

export type UserReward = {
  id: string;
  user_id: string;
  reward_id: string;
  unlocked_at: string;
  created_at: string;
};

export type MascotState = {
  id: string;
  user_id: string;
  glow_energy: number;
  evolution_stage: 'egg' | 'baby' | 'glowing' | 'cosmic' | 'legendary';
  mood: 'happy' | 'sleeping' | 'excited' | 'proud' | 'encouraging';
  last_interaction: string;
  created_at: string;
  updated_at: string;
};
