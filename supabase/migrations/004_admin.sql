-- Admin role table
CREATE TABLE admin_users (
  user_id    uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Authenticated users can check whether they themselves are an admin
CREATE POLICY "read_own_admin_row"
  ON admin_users FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read every journal entry
CREATE POLICY "admins_read_all_entries"
  ON journal_entries FOR SELECT
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Admins can read every stored Google token (needed to proxy Drive videos)
CREATE POLICY "admins_read_all_tokens"
  ON user_google_tokens FOR SELECT
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Admins can refresh any user's token (so the proxy can update expired tokens)
CREATE POLICY "admins_update_all_tokens"
  ON user_google_tokens FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- RPC: list every entry date that has content, for the admin calendar
CREATE OR REPLACE FUNCTION admin_all_entry_dates()
RETURNS TABLE (entry_date date)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not_admin';
  END IF;

  RETURN QUERY
    SELECT DISTINCT j.entry_date
    FROM journal_entries j
    WHERE j.content IS NOT NULL
       OR j.video_url IS NOT NULL
       OR j.recorded_video_drive_id IS NOT NULL
    ORDER BY j.entry_date;
END;
$$;

-- RPC: list entries for a given date with owner emails joined in
CREATE OR REPLACE FUNCTION admin_entries_for_date(target_date date)
RETURNS TABLE (
  entry_id                uuid,
  user_id                 uuid,
  user_email              text,
  content                 text,
  video_url               text,
  recorded_video_drive_id text,
  updated_at              timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not_admin';
  END IF;

  RETURN QUERY
    SELECT j.id, j.user_id, u.email::text, j.content, j.video_url,
           j.recorded_video_drive_id, j.updated_at
    FROM journal_entries j
    JOIN auth.users u ON u.id = j.user_id
    WHERE j.entry_date = target_date
    ORDER BY u.email;
END;
$$;

-- To grant admin to a user, run:
--   INSERT INTO admin_users (user_id) SELECT id FROM auth.users WHERE email = 'you@example.com';
