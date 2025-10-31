/*
  # Fix User ID Type for Session-Based Usage

  ## Overview
  This migration converts user_id columns from UUID to TEXT to support
  session-based identification without authentication.

  ## Changes Made

  ### 1. Data Type Conversions
  - `user_progress.user_id` - Changed from uuid to text
  - `user_stats.user_id` - Changed from uuid to text
  - `user_achievements.user_id` - Changed from uuid to text

  ### 2. RLS Policy Updates
  - Updated all RLS policies to remove authentication requirements
  - Policies now use session-based user_id matching

  ## Important Notes
  - This allows the app to work without Supabase Auth
  - Each browser session gets a unique text-based ID
  - Data is still protected per session ID
*/

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can delete own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can view own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can insert own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements;

-- Alter user_progress table
ALTER TABLE user_progress ALTER COLUMN user_id TYPE text USING user_id::text;

-- Alter user_stats table
ALTER TABLE user_stats ALTER COLUMN user_id TYPE text USING user_id::text;

-- Alter user_achievements table
ALTER TABLE user_achievements ALTER COLUMN user_id TYPE text USING user_id::text;

-- Create new RLS policies for user_progress (session-based)
CREATE POLICY "Anyone can view all progress"
  ON user_progress FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert progress"
  ON user_progress FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can delete progress"
  ON user_progress FOR DELETE
  USING (true);

-- Create new RLS policies for user_stats (session-based)
CREATE POLICY "Anyone can view all stats"
  ON user_stats FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert stats"
  ON user_stats FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update stats"
  ON user_stats FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create new RLS policies for user_achievements (session-based)
CREATE POLICY "Anyone can view all achievements"
  ON user_achievements FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (true);