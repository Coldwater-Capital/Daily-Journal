-- Highlights and skills: optional, 0..many per (user, entry_date).
-- Additive only. Existing journal_entries are untouched.

CREATE TABLE highlights (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  entry_date  date NOT NULL,
  text        text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX highlights_user_date_idx ON highlights (user_id, entry_date);

ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_highlights"
  ON highlights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "insert_own_highlights"
  ON highlights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_highlights"
  ON highlights FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "admins_read_all_highlights"
  ON highlights FOR SELECT
  USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid()));

CREATE TABLE skills (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  entry_date  date NOT NULL,
  text        text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX skills_user_date_idx ON skills (user_id, entry_date);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_skills"
  ON skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "insert_own_skills"
  ON skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_skills"
  ON skills FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "admins_read_all_skills"
  ON skills FOR SELECT
  USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid()));

-- Admin RPC: list every user that has ever made an entry, with counts.
-- Drives the admin "by user" list view.
CREATE OR REPLACE FUNCTION admin_users_with_counts()
RETURNS TABLE (
  user_id          uuid,
  user_email       text,
  entry_count      bigint,
  highlight_count  bigint,
  skill_count      bigint,
  last_entry_date  date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not_admin';
  END IF;

  RETURN QUERY
    SELECT
      u.id,
      u.email::text,
      (SELECT COUNT(*) FROM journal_entries j WHERE j.user_id = u.id
        AND (j.content IS NOT NULL OR j.video_url IS NOT NULL OR j.recorded_video_drive_id IS NOT NULL)),
      (SELECT COUNT(*) FROM highlights h WHERE h.user_id = u.id),
      (SELECT COUNT(*) FROM skills s WHERE s.user_id = u.id),
      (SELECT MAX(j.entry_date) FROM journal_entries j WHERE j.user_id = u.id
        AND (j.content IS NOT NULL OR j.video_url IS NOT NULL OR j.recorded_video_drive_id IS NOT NULL))
    FROM auth.users u
    WHERE EXISTS (
      SELECT 1 FROM journal_entries j2
      WHERE j2.user_id = u.id
        AND (j2.content IS NOT NULL OR j2.video_url IS NOT NULL OR j2.recorded_video_drive_id IS NOT NULL)
    )
    ORDER BY u.email;
END;
$$;

-- Admin RPC: all entries for one user, chronological. Drives "click user → their entries".
CREATE OR REPLACE FUNCTION admin_entries_for_user(target_user_id uuid)
RETURNS TABLE (
  entry_id                 uuid,
  entry_date               date,
  content                  text,
  video_url                text,
  recorded_video_drive_id  text,
  updated_at               timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not_admin';
  END IF;

  RETURN QUERY
    SELECT j.id, j.entry_date, j.content, j.video_url,
           j.recorded_video_drive_id, j.updated_at
    FROM journal_entries j
    WHERE j.user_id = target_user_id
      AND (j.content IS NOT NULL OR j.video_url IS NOT NULL OR j.recorded_video_drive_id IS NOT NULL)
    ORDER BY j.entry_date;
END;
$$;

-- Admin RPC: all entries across all users, chronological. Drives "By entry day" list view.
CREATE OR REPLACE FUNCTION admin_all_entries()
RETURNS TABLE (
  entry_id                 uuid,
  user_id                  uuid,
  user_email               text,
  entry_date               date,
  content                  text,
  video_url                text,
  recorded_video_drive_id  text,
  updated_at               timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not_admin';
  END IF;

  RETURN QUERY
    SELECT j.id, j.user_id, u.email::text, j.entry_date, j.content, j.video_url,
           j.recorded_video_drive_id, j.updated_at
    FROM journal_entries j
    JOIN auth.users u ON u.id = j.user_id
    WHERE j.content IS NOT NULL OR j.video_url IS NOT NULL OR j.recorded_video_drive_id IS NOT NULL
    ORDER BY j.entry_date, u.email;
END;
$$;
