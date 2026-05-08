-- Allow users to delete their own journal entries
CREATE POLICY "delete_own_entries"
  ON journal_entries FOR DELETE
  USING (auth.uid() = user_id);
