/*
  # Gamification System: Glow Points, Badges, Levels, Rewards & Mascot

  ## Overview
  This migration transforms the app into a full gamification experience:
  - Challenges get difficulty levels (easy/medium/hard) worth Glow Points (10/25/50 XP)
  - user_stats gains glow_points, perfect_days, and last_perfect_day tracking
  - The achievements table is expanded with rarity, tier, and new requirement types
  - A new rewards table stores unlockable content (themes, avatars, badge borders, etc.)
  - A user_rewards table tracks which rewards a user has unlocked
  - A mascot_state table tracks the Star Dragon companion's evolution and mood

  ## Modified Tables

  ### 1. `challenges`
  - Added `difficulty` (text, default 'medium') — 'easy', 'medium', or 'hard'
  - Added `glow_points` (integer, default 25) — XP awarded for completion

  ### 2. `user_stats`
  - Added `glow_points` (integer, default 0) — total XP accumulated
  - Added `perfect_days` (integer, default 0) — count of perfect days
  - Added `last_perfect_day` (date) — last date a perfect day was achieved

  ### 3. `achievements`
  - Added `rarity` (text, default 'common') — 'common', 'rare', 'epic', 'legendary', 'secret'
  - Added `tier` (text, default 'bronze') — 'bronze', 'silver', 'gold', 'platinum'
  - Added `requirement_type` constraint expanded: now includes 'perfect_day', 'time_of_day', 'comeback', 'points'
  - Added `requirement_subtype` (text) — for sub-conditions like 'night' or 'morning'

  ## New Tables

  ### 4. `rewards`
  Stores unlockable content tied to level milestones
  - `id` (uuid, PK)
  - `name` (text) — reward name
  - `description` (text) — what the reward is
  - `reward_type` (text) — 'theme', 'avatar', 'badge_border', 'challenge_pack', 'confetti'
  - `required_level` (integer) — level at which this unlocks
  - `icon` (text) — icon name
  - `created_at` (timestamptz)

  ### 5. `user_rewards`
  Tracks which rewards a user has unlocked
  - `id` (uuid, PK)
  - `user_id` (text) — session ID
  - `reward_id` (uuid, FK to rewards)
  - `unlocked_at` (timestamptz)
  - `created_at` (timestamptz)
  - UNIQUE(user_id, reward_id)

  ### 6. `mascot_state`
  Tracks the Star Dragon companion per user session
  - `id` (uuid, PK)
  - `user_id` (text, unique) — session ID
  - `glow_energy` (integer, default 0) — energy feeding the dragon's growth
  - `evolution_stage` (text, default 'egg') — 'egg', 'baby', 'glowing', 'cosmic', 'legendary'
  - `mood` (text, default 'happy') — 'happy', 'sleeping', 'excited', 'proud', 'encouraging'
  - `last_interaction` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all new tables (rewards, user_rewards, mascot_state)
  - Session-based policies (TO anon, authenticated) matching the existing no-auth pattern
  - rewards table is public read (anyone can see available rewards)
  - user_rewards and mascot_state are open to anon/authenticated (session-based, no auth)

  ## Important Notes
  - Existing challenges get difficulty assigned by duration: <=3min=easy, <=10min=medium, >10min=hard
  - Glow points are calculated from difficulty: easy=10, medium=25, hard=50
  - The achievements table is cleared and re-seeded with the full badge catalog
  - Level thresholds: Seed(0), Bloom(100), Blossom(300), Radiant(600), Diamond(1000), Glow Queen/King(2000), Cosmic Legend(5000)
*/

-- ============================================================
-- 1. Add difficulty and glow_points to challenges
-- ============================================================
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'medium'
    CHECK (difficulty IN ('easy', 'medium', 'hard'));

ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS glow_points integer NOT NULL DEFAULT 25;

-- Assign difficulty based on duration for existing challenges
UPDATE challenges SET difficulty = 'easy', glow_points = 10 WHERE duration_minutes <= 3;
UPDATE challenges SET difficulty = 'medium', glow_points = 25 WHERE duration_minutes > 3 AND duration_minutes <= 10;
UPDATE challenges SET difficulty = 'hard', glow_points = 50 WHERE duration_minutes > 10;

-- ============================================================
-- 2. Add glow_points, perfect_days, last_perfect_day to user_stats
-- ============================================================
ALTER TABLE user_stats
  ADD COLUMN IF NOT EXISTS glow_points integer NOT NULL DEFAULT 0;

ALTER TABLE user_stats
  ADD COLUMN IF NOT EXISTS perfect_days integer NOT NULL DEFAULT 0;

ALTER TABLE user_stats
  ADD COLUMN IF NOT EXISTS last_perfect_day date;

-- ============================================================
-- 3. Expand achievements table
-- ============================================================
ALTER TABLE achievements
  ADD COLUMN IF NOT EXISTS rarity text NOT NULL DEFAULT 'common'
    CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'secret'));

ALTER TABLE achievements
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'bronze'
    CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum'));

ALTER TABLE achievements
  ADD COLUMN IF NOT EXISTS requirement_subtype text;

-- Expand the requirement_type constraint to include new types
ALTER TABLE achievements DROP CONSTRAINT IF EXISTS achievements_requirement_type_check;
ALTER TABLE achievements ADD CONSTRAINT achievements_requirement_type_check
  CHECK (requirement_type IN ('streak', 'total', 'category', 'level', 'perfect_day', 'time_of_day', 'comeback', 'points'));

-- Clear old achievements and insert the full new catalog
DELETE FROM user_achievements;
DELETE FROM achievements;

INSERT INTO achievements (name, description, icon, requirement_type, requirement_value, category, rarity, tier, requirement_subtype) VALUES
  -- Bronze badges
  ('Eerste Stap', 'Voltooi je eerste challenge', 'star', 'total', 1, NULL, 'common', 'bronze', NULL),
  ('3 Dagen Vlam', '3 dagen achter elkaar actief', 'flame', 'streak', 3, NULL, 'common', 'bronze', NULL),
  ('7 Day Glow', '7 dagen streak', 'sparkles', 'streak', 7, NULL, 'rare', 'bronze', NULL),
  ('Night Owl', 'Voltooi een challenge na 22:00', 'moon', 'time_of_day', 1, NULL, 'rare', 'bronze', 'night'),
  ('Early Bird', 'Voltooi een challenge voor 08:00', 'sunrise', 'time_of_day', 1, NULL, 'rare', 'bronze', 'morning'),
  -- Silver badges
  ('Self Care Queen/King', '50 self-care challenges voltooid', 'heart', 'category', 50, 'self-care', 'epic', 'silver', NULL),
  ('Mind Master', '50 mindset challenges', 'brain', 'category', 50, 'mindset', 'epic', 'silver', NULL),
  ('Fitness Fanatic', '100 health challenges voltooid', 'dumbbell', 'category', 100, 'health', 'epic', 'silver', NULL),
  ('Bookworm', '10 mindset leesopdrachten voltooid', 'book-open', 'category', 10, 'mindset', 'rare', 'silver', NULL),
  ('Healthy Habit', '30 gezonde gewoontes voltooid', 'apple', 'category', 30, 'health', 'rare', 'silver', NULL),
  ('Perfect Day', 'Alle dagelijkse challenges voltooid', 'target', 'perfect_day', 1, NULL, 'rare', 'silver', NULL),
  -- Gold badges
  ('Diamond Discipline', '30 dagen streak', 'gem', 'streak', 30, NULL, 'epic', 'gold', NULL),
  ('Hydration Hero', '7 dagen hydration challenges', 'droplet', 'category', 7, 'health', 'rare', 'gold', NULL),
  ('Sleep Champion', '7 nachten self-care voltooid', 'moon', 'category', 7, 'self-care', 'rare', 'gold', NULL),
  ('Comeback Kid', 'Na 7 dagen afwezigheid weer gestart', 'rotate-ccw', 'comeback', 7, NULL, 'epic', 'gold', NULL),
  ('1000 Points Club', 'Bereik 1000 Glow Points', 'zap', 'points', 1000, NULL, 'epic', 'gold', NULL),
  -- Platinum / Legendary badges
  ('Glow Legend', '365 dagen actief', 'crown', 'streak', 365, NULL, 'legendary', 'platinum', NULL),
  -- Secret badges
  ('Lucky Day', 'Krijg willekeurig een bonusbadge (0.5% kans)', 'rainbow', 'total', 50, NULL, 'secret', 'platinum', NULL),
  ('Secret Finder', 'Ontdek een verborgen easter egg', 'key', 'total', 100, NULL, 'secret', 'platinum', NULL);

-- ============================================================
-- 4. Create rewards table
-- ============================================================
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('theme', 'avatar', 'badge_border', 'challenge_pack', 'confetti')),
  required_level integer NOT NULL,
  icon text NOT NULL DEFAULT 'gift',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view rewards" ON rewards;
CREATE POLICY "Anyone can view rewards"
  ON rewards FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO rewards (name, description, reward_type, required_level, icon) VALUES
  ('Pastel Theme', 'Ontgrendel een zacht pastel thema', 'theme', 2, 'palette'),
  ('Star Avatar', 'Een schattig sterren avatar', 'avatar', 3, 'star'),
  ('Glow Badge Border', 'Glowende rand voor je badges', 'badge_border', 5, 'sparkles'),
  ('Confetti Burst', 'Confetti animatie bij voltooiing', 'confetti', 5, 'party-popper'),
  ('Ocean Theme', 'Rustig blauw oceaan thema', 'theme', 7, 'waves'),
  ('Dragon Avatar', 'Babydraak avatar', 'avatar', 7, 'dragon'),
  ('Challenge Pack: Wellness', 'Nieuwe wellness challenges', 'challenge_pack', 10, 'package'),
  ('Gold Badge Border', 'Gouden rand voor je badges', 'badge_border', 10, 'crown'),
  ('Sunset Theme', 'Warm zonsondergang thema', 'theme', 15, 'sunset'),
  ('Glowing Dragon Avatar', 'Glowende draak avatar', 'avatar', 15, 'sparkles'),
  ('Rainbow Confetti', 'Regenboog confetti animatie', 'confetti', 15, 'rainbow'),
  ('Challenge Pack: Mindful', 'Nieuwe mindfulness challenges', 'challenge_pack', 20, 'package'),
  ('Cosmic Theme', 'Kosmisch sterren thema', 'theme', 30, 'galaxy'),
  ('Cosmic Dragon Avatar', 'Kosmische draak avatar', 'avatar', 30, 'star'),
  ('Platinum Badge Border', 'Platina rand voor je badges', 'badge_border', 30, 'gem'),
  ('Legendary Pack', 'Legendarische challenge pack', 'challenge_pack', 50, 'package'),
  ('Legendary Glow Theme', 'Het ultieme glow thema', 'theme', 50, 'crown');

-- ============================================================
-- 5. Create user_rewards table
-- ============================================================
CREATE TABLE IF NOT EXISTS user_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  reward_id uuid NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, reward_id)
);

CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON user_rewards(user_id);

ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view user_rewards" ON user_rewards;
CREATE POLICY "Anyone can view user_rewards"
  ON user_rewards FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert user_rewards" ON user_rewards;
CREATE POLICY "Anyone can insert user_rewards"
  ON user_rewards FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ============================================================
-- 6. Create mascot_state table
-- ============================================================
CREATE TABLE IF NOT EXISTS mascot_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL,
  glow_energy integer NOT NULL DEFAULT 0,
  evolution_stage text NOT NULL DEFAULT 'egg'
    CHECK (evolution_stage IN ('egg', 'baby', 'glowing', 'cosmic', 'legendary')),
  mood text NOT NULL DEFAULT 'happy'
    CHECK (mood IN ('happy', 'sleeping', 'excited', 'proud', 'encouraging')),
  last_interaction timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mascot_state_user_id ON mascot_state(user_id);

ALTER TABLE mascot_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view mascot_state" ON mascot_state;
CREATE POLICY "Anyone can view mascot_state"
  ON mascot_state FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert mascot_state" ON mascot_state;
CREATE POLICY "Anyone can insert mascot_state"
  ON mascot_state FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update mascot_state" ON mascot_state;
CREATE POLICY "Anyone can update mascot_state"
  ON mascot_state FOR UPDATE
  TO anon, authenticated
  USING (true) WITH CHECK (true);
