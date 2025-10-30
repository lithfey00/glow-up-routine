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
  created_at: string;
};

export type UserProgress = {
  id: string;
  user_id: string;
  challenge_id: string;
  completed_at: string;
  created_at: string;
};
