/*
# Screen Views Analytics

1. New Tables
- `screen_views`
  - `id` (uuid, primary key)
  - `session_id` (text, identifies the browser session)
  - `screen_name` (text, which tab/screen was viewed: home, challenges, progress, rewards, profile)
  - `viewed_at` (timestamptz, when the view happened)

2. Purpose
- Tracks how many times each screen/tab is viewed, per session.
- Enables analytics display in the Profile screen showing view counts per screen.

3. Security
- Enable RLS on `screen_views`.
- This is a single-tenant no-auth app, so allow anon + authenticated full CRUD.
*/

CREATE TABLE IF NOT EXISTS screen_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  screen_name text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_screen_views_session ON screen_views(session_id);
CREATE INDEX IF NOT EXISTS idx_screen_views_screen ON screen_views(screen_name);

ALTER TABLE screen_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_screen_views" ON screen_views;
CREATE POLICY "anon_select_screen_views" ON screen_views FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_screen_views" ON screen_views;
CREATE POLICY "anon_insert_screen_views" ON screen_views FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_screen_views" ON screen_views;
CREATE POLICY "anon_update_screen_views" ON screen_views FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_screen_views" ON screen_views;
CREATE POLICY "anon_delete_screen_views" ON screen_views FOR DELETE
  TO anon, authenticated USING (true);
