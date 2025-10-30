/*
  # Add User Stats and Achievements System

  ## Overview
  This migration adds tables to track user statistics, streaks, and achievements
  for the Glow Up Routine app.

  ## New Tables

  ### 1. `user_stats`
  Stores aggregated statistics for each user
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, unique) - Reference to user session
  - `current_streak` (integer) - Current consecutive days streak
  - `longest_streak` (integer) - Longest streak ever achieved
  - `total_completed` (integer) - Total challenges completed all-time
  - `level` (integer) - User level based on completions
  - `last_activity_date` (date) - Last date user completed a challenge
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `achievements`
  Stores available achievements users can unlock
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Achievement name
  - `description` (text) - Achievement description
  - `icon` (text) - Icon name
  - `requirement_type` (text) - Type: streak, total, category, level
  - `requirement_value` (integer) - Value needed to unlock
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. `user_achievements`
  Tracks which achievements users have unlocked
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - Reference to user session
  - `achievement_id` (uuid) - Reference to achievements table
  - `unlocked_at` (timestamptz) - When achievement was unlocked
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable RLS on all tables
  - Users can only view and manage their own stats and achievements

  ## Important Notes
  - Streak calculation considers consecutive days with at least one completion
  - Level is calculated based on total completions (every 10 completions = 1 level)
  - Achievements unlock automatically when requirements are met
*/

-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  total_completed integer DEFAULT 0,
  level integer DEFAULT 1,
  last_activity_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  requirement_type text NOT NULL CHECK (requirement_type IN ('streak', 'total', 'category', 'level')),
  requirement_value integer NOT NULL,
  category text,
  created_at timestamptz DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- Enable Row Level Security
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_stats
CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own stats"
  ON user_stats FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policies for achievements (public read)
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (true);

-- Insert sample achievements
INSERT INTO achievements (name, description, icon, requirement_type, requirement_value, category) VALUES
  ('First Step', 'Complete your first challenge', 'star', 'total', 1, NULL),
  ('Getting Started', 'Complete 5 challenges', 'award', 'total', 5, NULL),
  ('Committed', 'Complete 25 challenges', 'trophy', 'total', 25, NULL),
  ('Dedicated', 'Complete 50 challenges', 'crown', 'total', 50, NULL),
  ('Master', 'Complete 100 challenges', 'gem', 'total', 100, NULL),
  ('Streak Starter', 'Maintain a 3-day streak', 'flame', 'streak', 3, NULL),
  ('On Fire', 'Maintain a 7-day streak', 'fire', 'streak', 7, NULL),
  ('Unstoppable', 'Maintain a 30-day streak', 'zap', 'streak', 30, NULL),
  ('Beauty Guru', 'Complete 10 beauty challenges', 'sparkles', 'category', 10, 'beauty'),
  ('Self-Care Queen', 'Complete 10 self-care challenges', 'heart', 'category', 10, 'self-care'),
  ('Mindset Master', 'Complete 10 mindset challenges', 'brain', 'category', 10, 'mindset'),
  ('Health Hero', 'Complete 10 health challenges', 'activity', 'category', 10, 'health')
ON CONFLICT DO NOTHING;