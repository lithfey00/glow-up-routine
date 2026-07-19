/*
# Premium Self-Care & Habit Tracker Features

## Overview
Adds tables for mood tracking, wellness trackers, custom routines, progress journal,
daily rewards, glow shop, focus mode sessions, and smart notifications. All tables
follow the existing no-auth session-based pattern (user_id text, anon+authenticated policies).

## New Tables

### 1. `mood_logs`
Daily mood entries used by the AI coach to personalize routines.
- id, user_id, mood (happy/calm/tired/stressed/sad/motivated), energy (1-5), notes, logged_at

### 2. `wellness_trackers`
Daily wellness metrics: water (glasses), sleep (hours), exercise (min),
meditation (min), reading (min), skincare (bool). One row per user per day.
- id, user_id, date (unique per user), water_glasses, sleep_hours, exercise_min,
  meditation_min, reading_min, skincare_done, updated_at

### 3. `routines`
User-created custom routines (morning/afternoon/evening). Multiple per user.
- id, user_id, name, time_of_day, is_active, created_at

### 4. `routine_items`
Challenges linked to a routine, ordered.
- id, routine_id, challenge_id, sort_order

### 5. `journal_entries`
Daily journal with optional photo URL and mood tag.
- id, user_id, entry_date, title, content, photo_url, mood, created_at

### 6. `daily_reward_claims`
Tracks claimed daily login rewards and mystery gifts.
- id, user_id, claim_date, reward_type (daily/mystery/bonus), glow_points_awarded

### 7. `shop_items`
Items purchasable with Glow Points.
- id, name, description, category (theme/wallpaper/avatar/icon/buddy_skin/decoration),
  price, icon, preview_gradient

### 8. `user_shop_items`
Purchased items per user.
- id, user_id, shop_item_id, purchased_at, is_equipped

### 9. `focus_sessions`
Focus mode usage log.
- id, user_id, sound (rain/forest/ocean/cafe/lofi), duration_min, started_at

### 10. `notifications`
Friendly adaptive reminders.
- id, user_id, title, message, type, scheduled_for, is_read, created_at

## Security
- RLS enabled on all new tables.
- All policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  matching the existing no-auth session-based pattern.
- Data is scoped by user_id at the application layer (session ID).

## Important Notes
- All user_id columns are text (matching existing session-based pattern).
- wellness_trackers has a unique (user_id, date) constraint for upsert support.
- shop_items is seeded with a starter catalog.
- No destructive changes to existing tables.
*/

-- ============================================================
-- 1. mood_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS mood_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  mood text NOT NULL CHECK (mood IN ('happy','calm','tired','stressed','sad','motivated')),
  energy integer NOT NULL DEFAULT 3 CHECK (energy >= 1 AND energy <= 5),
  notes text,
  logged_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mood_logs_user_id ON mood_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_logs_logged_at ON mood_logs(logged_at);
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_mood_logs" ON mood_logs;
CREATE POLICY "anon_select_mood_logs" ON mood_logs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_mood_logs" ON mood_logs;
CREATE POLICY "anon_insert_mood_logs" ON mood_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_mood_logs" ON mood_logs;
CREATE POLICY "anon_update_mood_logs" ON mood_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_mood_logs" ON mood_logs;
CREATE POLICY "anon_delete_mood_logs" ON mood_logs FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 2. wellness_trackers
-- ============================================================
CREATE TABLE IF NOT EXISTS wellness_trackers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  date date NOT NULL,
  water_glasses integer NOT NULL DEFAULT 0,
  sleep_hours numeric(4,1) NOT NULL DEFAULT 0,
  exercise_min integer NOT NULL DEFAULT 0,
  meditation_min integer NOT NULL DEFAULT 0,
  reading_min integer NOT NULL DEFAULT 0,
  skincare_done boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_wellness_user_id ON wellness_trackers(user_id);
ALTER TABLE wellness_trackers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_wellness" ON wellness_trackers;
CREATE POLICY "anon_select_wellness" ON wellness_trackers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_wellness" ON wellness_trackers;
CREATE POLICY "anon_insert_wellness" ON wellness_trackers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_wellness" ON wellness_trackers;
CREATE POLICY "anon_update_wellness" ON wellness_trackers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_wellness" ON wellness_trackers;
CREATE POLICY "anon_delete_wellness" ON wellness_trackers FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 3. routines
-- ============================================================
CREATE TABLE IF NOT EXISTS routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  time_of_day text NOT NULL CHECK (time_of_day IN ('morning','afternoon','evening')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id);
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_routines" ON routines;
CREATE POLICY "anon_select_routines" ON routines FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_routines" ON routines;
CREATE POLICY "anon_insert_routines" ON routines FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_routines" ON routines;
CREATE POLICY "anon_update_routines" ON routines FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_routines" ON routines;
CREATE POLICY "anon_delete_routines" ON routines FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 4. routine_items
-- ============================================================
CREATE TABLE IF NOT EXISTS routine_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_routine_items_routine_id ON routine_items(routine_id);
ALTER TABLE routine_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_routine_items" ON routine_items;
CREATE POLICY "anon_select_routine_items" ON routine_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_routine_items" ON routine_items;
CREATE POLICY "anon_insert_routine_items" ON routine_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_routine_items" ON routine_items;
CREATE POLICY "anon_delete_routine_items" ON routine_items FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 5. journal_entries
-- ============================================================
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  entry_date date NOT NULL,
  title text,
  content text,
  photo_url text,
  mood text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_journal_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_date ON journal_entries(entry_date);
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_journal" ON journal_entries;
CREATE POLICY "anon_select_journal" ON journal_entries FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_journal" ON journal_entries;
CREATE POLICY "anon_insert_journal" ON journal_entries FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_journal" ON journal_entries;
CREATE POLICY "anon_update_journal" ON journal_entries FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_journal" ON journal_entries;
CREATE POLICY "anon_delete_journal" ON journal_entries FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 6. daily_reward_claims
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_reward_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  claim_date date NOT NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('daily','mystery','bonus')),
  glow_points_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, claim_date, reward_type)
);
CREATE INDEX IF NOT EXISTS idx_daily_rewards_user_id ON daily_reward_claims(user_id);
ALTER TABLE daily_reward_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_daily_rewards" ON daily_reward_claims;
CREATE POLICY "anon_select_daily_rewards" ON daily_reward_claims FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_daily_rewards" ON daily_reward_claims;
CREATE POLICY "anon_insert_daily_rewards" ON daily_reward_claims FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ============================================================
-- 7. shop_items
-- ============================================================
CREATE TABLE IF NOT EXISTS shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('theme','wallpaper','avatar','icon','buddy_skin','decoration')),
  price integer NOT NULL DEFAULT 50,
  icon text NOT NULL DEFAULT 'sparkles',
  preview_gradient text NOT NULL DEFAULT 'from-pink-400 to-violet-400',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_shop_items" ON shop_items;
CREATE POLICY "anon_select_shop_items" ON shop_items FOR SELECT TO anon, authenticated USING (true);

INSERT INTO shop_items (name, description, category, price, icon, preview_gradient) VALUES
  ('Rose Quartz Theme', 'Soft rose pink palette', 'theme', 100, 'palette', 'from-rose-300 to-pink-400'),
  ('Ocean Breeze Theme', 'Calming blue tones', 'theme', 150, 'waves', 'from-blue-300 to-cyan-400'),
  ('Forest Glow Theme', 'Earthy green palette', 'theme', 150, 'trees', 'from-emerald-300 to-teal-400'),
  ('Sunset Bloom Wallpaper', 'Warm sunset gradient', 'wallpaper', 120, 'sunset', 'from-orange-300 to-pink-400'),
  ('Moonlit Wallpaper', 'Dreamy night sky', 'wallpaper', 120, 'moon', 'from-indigo-300 to-violet-400'),
  ('Sakura Wallpaper', 'Cherry blossom petals', 'wallpaper', 180, 'flower', 'from-pink-200 to-rose-300'),
  ('Star Avatar', 'Cute star companion', 'avatar', 80, 'star', 'from-amber-300 to-yellow-400'),
  ('Moon Avatar', 'Serene moon face', 'avatar', 80, 'moon', 'from-indigo-300 to-blue-400'),
  ('Flower Avatar', 'Blooming flower icon', 'avatar', 100, 'flower', 'from-pink-300 to-rose-400'),
  ('Sparkle Icon Set', 'Glowing sparkle icons', 'icon', 60, 'sparkles', 'from-violet-300 to-purple-400'),
  ('Heart Icon Set', 'Pastel heart icons', 'icon', 60, 'heart', 'from-rose-300 to-pink-400'),
  ('Leaf Icon Set', 'Fresh leaf icons', 'icon', 70, 'leaf', 'from-green-300 to-emerald-400'),
  ('Seed Buddy Skin', 'Adorable seedling buddy', 'buddy_skin', 200, 'sprout', 'from-green-300 to-lime-400'),
  ('Flower Buddy Skin', 'Blooming flower buddy', 'buddy_skin', 300, 'flower', 'from-pink-300 to-rose-400'),
  ('Crystal Buddy Skin', 'Shimmering crystal buddy', 'buddy_skin', 400, 'gem', 'from-cyan-300 to-blue-400'),
  ('Glow Halo Decoration', 'Glowing halo around profile', 'decoration', 250, 'sparkles', 'from-amber-300 to-orange-400'),
  ('Petal Frame Decoration', 'Floating petal frame', 'decoration', 250, 'flower', 'from-pink-300 to-rose-400'),
  ('Starlight Border Decoration', 'Twinkling star border', 'decoration', 300, 'star', 'from-violet-300 to-indigo-400')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. user_shop_items
-- ============================================================
CREATE TABLE IF NOT EXISTS user_shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  shop_item_id uuid NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
  purchased_at timestamptz DEFAULT now(),
  is_equipped boolean NOT NULL DEFAULT false,
  UNIQUE(user_id, shop_item_id)
);
CREATE INDEX IF NOT EXISTS idx_user_shop_items_user_id ON user_shop_items(user_id);
ALTER TABLE user_shop_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_user_shop_items" ON user_shop_items;
CREATE POLICY "anon_select_user_shop_items" ON user_shop_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_user_shop_items" ON user_shop_items;
CREATE POLICY "anon_insert_user_shop_items" ON user_shop_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_user_shop_items" ON user_shop_items;
CREATE POLICY "anon_update_user_shop_items" ON user_shop_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_user_shop_items" ON user_shop_items;
CREATE POLICY "anon_delete_user_shop_items" ON user_shop_items FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 9. focus_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  sound text NOT NULL CHECK (sound IN ('rain','forest','ocean','cafe','lofi')),
  duration_min integer NOT NULL DEFAULT 15,
  started_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_focus_sessions" ON focus_sessions;
CREATE POLICY "anon_select_focus_sessions" ON focus_sessions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_focus_sessions" ON focus_sessions;
CREATE POLICY "anon_insert_focus_sessions" ON focus_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ============================================================
-- 10. notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'reminder',
  scheduled_for timestamptz DEFAULT now(),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_notifications" ON notifications;
CREATE POLICY "anon_select_notifications" ON notifications FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_notifications" ON notifications;
CREATE POLICY "anon_insert_notifications" ON notifications FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_notifications" ON notifications;
CREATE POLICY "anon_update_notifications" ON notifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_notifications" ON notifications;
CREATE POLICY "anon_delete_notifications" ON notifications FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 11. Add buddy_evolution_stage to mascot_state for new evolution system
-- ============================================================
ALTER TABLE mascot_state
  ADD COLUMN IF NOT EXISTS buddy_xp integer NOT NULL DEFAULT 0;
