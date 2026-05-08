-- Add video recording column to journal entries
ALTER TABLE journal_entries
  ADD COLUMN recorded_video_drive_id text DEFAULT NULL;

-- Store Google OAuth tokens per user
CREATE TABLE user_google_tokens (
  user_id         uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  access_token    text NOT NULL,
  refresh_token   text,
  token_expires_at timestamptz NOT NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TRIGGER handle_tokens_updated_at
  BEFORE UPDATE ON user_google_tokens
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime(updated_at);

ALTER TABLE user_google_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_tokens"
  ON user_google_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "insert_own_tokens"
  ON user_google_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_tokens"
  ON user_google_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
