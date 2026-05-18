-- Fix admin_entries_for_date: the unqualified `user_id` in the admin check
-- collided with the function's OUT parameter named user_id (which is NULL
-- at check time), so the admin check always failed and the function
-- returned zero rows. Qualifying as admin_users.user_id fixes it.

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
  IF NOT EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid()) THEN
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
