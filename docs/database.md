---
title: Database
source_files: [supabase/migrations/001_initial.sql, supabase/migrations/002_google_drive.sql, supabase/migrations/003_delete_policy.sql]
entry_points: [journal_entries table, user_google_tokens table]
last_verified: 2026-05-08
---

# Database

Hosted Postgres on Supabase. Two tables. Row Level Security enforced at the database level on both.

## Setup (manual)

1. Go to your Supabase dashboard → SQL Editor → New query
2. Paste and run `supabase/migrations/001_initial.sql`
3. Paste and run `supabase/migrations/002_google_drive.sql`
4. Paste and run `supabase/migrations/003_delete_policy.sql`
5. Verify in Table Editor that both `journal_entries` and `user_google_tokens` exist with RLS enabled (shield icon)

## Schema

### `journal_entries`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Auto-generated |
| `user_id` | `uuid` | NOT NULL, REFERENCES auth.users ON DELETE CASCADE | Links to Supabase auth |
| `entry_date` | `date` | NOT NULL | Format: YYYY-MM-DD |
| `content` | `text` | DEFAULT NULL | Nullable — avoids phantom entries for visited but unedited days |
| `video_url` | `text` | DEFAULT NULL | YouTube, Vimeo, or Loom URL |
| `recorded_video_drive_id` | `text` | DEFAULT NULL | Google Drive file ID for webcam recordings |
| `created_at` | `timestamptz` | DEFAULT now() | Set on insert |
| `updated_at` | `timestamptz` | DEFAULT now() | Auto-updated by trigger |
| **UNIQUE** | — | (user_id, entry_date) | One entry per user per day |

### `user_google_tokens`

Stores Google OAuth credentials per user. Required for Drive video recording.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `user_id` | `uuid` | PRIMARY KEY, REFERENCES auth.users ON DELETE CASCADE | One row per user |
| `access_token` | `text` | NOT NULL | Short-lived Google access token |
| `refresh_token` | `text` | DEFAULT NULL | Long-lived token for refreshing access |
| `token_expires_at` | `timestamptz` | NOT NULL | Expiry of the current access token |
| `created_at` | `timestamptz` | DEFAULT now() | Set on insert |
| `updated_at` | `timestamptz` | DEFAULT now() | Auto-updated by trigger |

### Why `content` is nullable

If `content` were `NOT NULL DEFAULT ''`, visiting a date without typing would create a phantom row and an unwanted dot on the calendar. The auto-save skips the first render and only upserts after the user types, pastes, adds a URL, or records a video.

## Triggers

```sql
-- On journal_entries
create trigger handle_updated_at
  before update on journal_entries
  for each row execute procedure extensions.moddatetime(updated_at);

-- On user_google_tokens
create trigger handle_tokens_updated_at
  before update on user_google_tokens
  for each row execute procedure extensions.moddatetime(updated_at);
```

Both require the `moddatetime` extension (enabled in migration 001).

## Row Level Security

### `journal_entries`

```sql
create policy "select_own_entries"
  on journal_entries for select
  using (auth.uid() = user_id);

create policy "insert_own_entries"
  on journal_entries for insert
  with check (auth.uid() = user_id);

create policy "update_own_entries"
  on journal_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete_own_entries"
  on journal_entries for delete
  using (auth.uid() = user_id);
```

### `user_google_tokens`

```sql
create policy "select_own_tokens"
  on user_google_tokens for select
  using (auth.uid() = user_id);

create policy "insert_own_tokens"
  on user_google_tokens for insert
  with check (auth.uid() = user_id);

create policy "update_own_tokens"
  on user_google_tokens for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

There is no DELETE policy on `user_google_tokens` — those rows are removed only via `ON DELETE CASCADE` when the auth account is deleted. `journal_entries` has a DELETE policy so users can clear empty entries when navigating away.

## Upsert Pattern

The app never does separate INSERT then UPDATE. It always upserts:

```typescript
supabase.from('journal_entries').upsert({
  user_id: userId,
  entry_date: date,
  content: content || null,
  video_url: videoUrl || null,
}, { onConflict: 'user_id,entry_date' })
```

The `onConflict` string must exactly match the column names with no spaces. `recorded_video_drive_id` is written separately via the `/api/save-drive-video` route.

## TypeScript Types

```typescript
type JournalEntry = {
  id: string
  user_id: string
  entry_date: string           // 'YYYY-MM-DD'
  content: string | null
  video_url: string | null
  recorded_video_drive_id: string | null
  created_at: string
  updated_at: string
}

type UserGoogleTokens = {
  user_id: string
  access_token: string
  refresh_token: string | null
  token_expires_at: string
  created_at: string
  updated_at: string
}
```
