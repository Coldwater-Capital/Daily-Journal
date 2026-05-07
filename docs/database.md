---
title: Database
source_files: [supabase/migrations/001_initial.sql]
entry_points: [journal_entries table]
last_verified: 2026-05-07
---

# Database

Hosted Postgres on Supabase. One table. Row Level Security enforced at the database level.

## Setup (manual — not yet done)

1. Go to your Supabase dashboard → SQL Editor → New query
2. Paste the contents of `supabase/migrations/001_initial.sql` and run it
3. Verify in Table Editor that `journal_entries` exists with RLS enabled (shield icon)

## Schema

### `journal_entries`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Auto-generated |
| `user_id` | `uuid` | NOT NULL, REFERENCES auth.users ON DELETE CASCADE | Links to Supabase auth |
| `entry_date` | `date` | NOT NULL | Format: YYYY-MM-DD |
| `content` | `text` | DEFAULT NULL | Nullable — avoids phantom entries for visited but unedited days |
| `video_url` | `text` | DEFAULT NULL | YouTube or Vimeo URL |
| `created_at` | `timestamptz` | DEFAULT now() | Set on insert |
| `updated_at` | `timestamptz` | DEFAULT now() | Auto-updated by trigger |
| **UNIQUE** | — | (user_id, entry_date) | One entry per user per day |

### Why `content` is nullable

If `content` were `NOT NULL DEFAULT ''`, visiting a date without typing would create a phantom row, causing an unwanted dot to appear on the calendar. The auto-save skips the first render and only upserts after the user actually types or pastes something.

## Trigger

```sql
create trigger handle_updated_at
  before update on journal_entries
  for each row execute procedure extensions.moddatetime(updated_at);
```

Requires the `moddatetime` extension (included in the migration). Automatically sets `updated_at` to `now()` on every UPDATE.

## Row Level Security

RLS is enabled on `journal_entries`. Three per-operation policies, all enforcing `auth.uid() = user_id`.

```sql
-- Users can read only their own entries
create policy "select_own_entries"
  on journal_entries for select
  using (auth.uid() = user_id);

-- Users can insert only rows where user_id matches their auth ID
create policy "insert_own_entries"
  on journal_entries for insert
  with check (auth.uid() = user_id);

-- Users can update only their own entries
create policy "update_own_entries"
  on journal_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

No DELETE policy. Rows are deleted indirectly via `ON DELETE CASCADE` when the user's auth account is deleted.

## Upsert Pattern

The app never does a separate INSERT then UPDATE. It always upserts:

```typescript
supabase.from('journal_entries').upsert({
  user_id: userId,
  entry_date: date,
  content: content || null,
  video_url: videoUrl || null,
}, { onConflict: 'user_id,entry_date' })
```

The `onConflict` string must exactly match the column names with no spaces.

## TypeScript Type

```typescript
type JournalEntry = {
  id: string
  user_id: string
  entry_date: string  // 'YYYY-MM-DD'
  content: string | null
  video_url: string | null
  created_at: string
  updated_at: string
}
```
