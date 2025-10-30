/*
  # Glow Up Routine App Database Schema

  ## Overview
  This migration creates the database structure for a daily glow-up routine app
  that provides mini-challenges across beauty, self-care, mindset, and health categories.

  ## New Tables

  ### 1. `challenges`
  Stores all available daily challenges that users can complete
  - `id` (uuid, primary key) - Unique identifier for each challenge
  - `title` (text) - Challenge title (e.g., "5 min skincare routine")
  - `description` (text) - Detailed description of the challenge
  - `category` (text) - Category: beauty, self-care, mindset, or health
  - `duration_minutes` (integer) - Estimated time to complete
  - `icon` (text) - Icon name for visual representation
  - `created_at` (timestamptz) - Timestamp when challenge was created

  ### 2. `user_progress`
  Tracks which challenges users have completed and when
  - `id` (uuid, primary key) - Unique identifier for each completion record
  - `user_id` (uuid) - Reference to auth.users
  - `challenge_id` (uuid) - Reference to challenges table
  - `completed_at` (timestamptz) - When the challenge was completed
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  
  ### Row Level Security (RLS)
  - Enable RLS on all tables
  - `challenges` table: Public read access (anyone can view challenges)
  - `user_progress` table: Users can only view and manage their own progress

  ### RLS Policies
  1. Challenges - Public read access
  2. User Progress - Authenticated users can view their own progress
  3. User Progress - Authenticated users can insert their own completions
  4. User Progress - Authenticated users can delete their own completions

  ## Important Notes
  - All tables use UUID primary keys for scalability
  - Timestamps use timestamptz for proper timezone handling
  - RLS ensures data privacy and security
  - Foreign key constraints maintain data integrity
*/

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('beauty', 'self-care', 'mindset', 'health')),
  duration_minutes integer NOT NULL DEFAULT 5,
  icon text NOT NULL DEFAULT 'sparkles',
  created_at timestamptz DEFAULT now()
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed_at ON user_progress(completed_at);

-- Enable Row Level Security
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges (public read)
CREATE POLICY "Anyone can view challenges"
  ON challenges FOR SELECT
  USING (true);

-- RLS Policies for user_progress
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON user_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert sample challenges
INSERT INTO challenges (title, description, category, duration_minutes, icon) VALUES
  ('5-Minute Skincare Ritual', 'Cleanse, tone, and moisturize your face with intention', 'beauty', 5, 'sparkles'),
  ('Hydration Check', 'Drink a full glass of water and track your intake', 'health', 2, 'droplet'),
  ('Morning Affirmation', 'Repeat 3 positive affirmations in the mirror', 'mindset', 3, 'heart'),
  ('Gentle Stretch Session', 'Do 5 minutes of gentle stretching to wake up your body', 'health', 5, 'move'),
  ('Gratitude Journaling', 'Write down 3 things you''re grateful for today', 'mindset', 5, 'book-open'),
  ('Hair Care Moment', 'Brush your hair 100 strokes or apply a quick hair mask', 'beauty', 10, 'flower-2'),
  ('Digital Detox Break', 'Take 15 minutes away from all screens', 'self-care', 15, 'smartphone-off'),
  ('Power Pose', 'Stand in a confident pose for 2 minutes to boost energy', 'mindset', 2, 'zap'),
  ('Hand & Nail Care', 'Moisturize hands and groom your nails', 'beauty', 8, 'hand'),
  ('Breathing Exercise', 'Practice 4-7-8 breathing technique', 'health', 5, 'wind'),
  ('Self-Massage', 'Give yourself a 5-minute face or shoulder massage', 'self-care', 5, 'heart-pulse'),
  ('Healthy Snack', 'Prepare and enjoy a nutritious snack', 'health', 10, 'apple'),
  ('Posture Check', 'Set a reminder to check and correct your posture', 'health', 1, 'user-check'),
  ('Aromatherapy Moment', 'Light a candle or use essential oils for 10 minutes', 'self-care', 10, 'flame'),
  ('Visualization Practice', 'Spend 5 minutes visualizing your goals', 'mindset', 5, 'eye'),
  ('Quick Makeup Refresh', 'Try a new makeup look or refresh your current one', 'beauty', 15, 'palette'),
  ('Walk in Nature', 'Take a 20-minute walk outside', 'health', 20, 'trees'),
  ('Declutter Space', 'Organize one small area of your space', 'self-care', 10, 'sparkles'),
  ('Compliment Yourself', 'List 5 things you love about yourself', 'mindset', 3, 'smile'),
  ('Bath Ritual', 'Take a relaxing bath with salts or bubbles', 'self-care', 30, 'waves')
ON CONFLICT DO NOTHING;