---
title: Admin Dashboard
source_files:
  - supabase/migrations/004_admin.sql
  - lib/admin.ts
  - app/(dashboard)/admin/page.tsx
  - app/(dashboard)/admin/[date]/page.tsx
  - app/api/admin/video/[entryId]/route.ts
  - components/journal/AdminCalendar.tsx
  - app/(dashboard)/dashboard/page.tsx
entry_points:
  - /admin
  - /admin/[date]
  - /api/admin/video/[entryId]
  - admin_users (table)
  - admin_all_entry_dates (rpc)
  - admin_entries_for_date (rpc)
  - isAdmin (helper)
last_verified: 2026-05-18
---

# Admin Dashboard

Admin role for viewing every user's calendar entries across all dates. Admins see a master calendar showing days that any user has an entry, click a day to see every user's entry for that date (text + embedded video link + recorded Drive video), and can play recorded Drive videos that live in other users' personal Google Drives.

## Data model

### `admin_users` table

```sql
CREATE TABLE admin_users (
  user_id    uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
```

A user is an admin iff their `auth.uid()` appears in this table. There is no `role` column or enum — presence in the table is the only check.

### RLS additions (migration `004_admin.sql`)

On top of the existing per-user policies, admins get cross-user read access via three new policies:

- `admins_read_all_entries` on `journal_entries` — admins can `SELECT` every row.
- `admins_read_all_tokens` on `user_google_tokens` — admins can `SELECT` every user's Google access/refresh tokens. Required so the video proxy can use the entry owner's token to fetch the file from Drive.
- `admins_update_all_tokens` on `user_google_tokens` — admins can `UPDATE` any user's token row, used when the proxy refreshes a stale access token before fetching.

Non-admins are unaffected: their original `select_own_*`, `insert_own_*`, `update_own_*` policies still apply, and the EXISTS-on-`admin_users` check in the new policies is false for them.

`admin_users` itself has RLS enabled with only `read_own_admin_row` (self-check). To grant admin status:

```sql
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'someone@example.com';
```

This must be run from the Supabase SQL editor (service role) since there is no insert policy.

### SECURITY DEFINER RPCs

Two functions exist because joining `journal_entries` against `auth.users` for the owner email cannot be done from a normal `select()` (the `auth` schema is not exposed). Both gate on `admin_users` membership and raise `not_admin` otherwise.

- `admin_all_entry_dates()` returns every distinct `entry_date` that has non-null content, video_url, or recorded_video_drive_id. Drives the admin calendar dots.
- `admin_entries_for_date(target_date date)` returns `(entry_id, user_id, user_email, content, video_url, recorded_video_drive_id, updated_at)` for one date, ordered by email. Drives the day view.

## Routes

| Path | File | Purpose |
|---|---|---|
| `/admin` | `app/(dashboard)/admin/page.tsx` | Calendar across all users |
| `/admin/[date]` | `app/(dashboard)/admin/[date]/page.tsx` | Every user's entry for one date |
| `/api/admin/video/[entryId]` | `app/api/admin/video/[entryId]/route.ts` | Streams a recorded Drive video for the admin |

All three routes call `isAdmin()` server-side and return `notFound()` (pages) or `403` (API) for non-admins. The admin pages live under `(dashboard)` so they share the existing `Navbar` layout.

`/admin` calls `supabase.rpc('admin_all_entry_dates')` and renders `AdminCalendar`, a thin variant of the user `Calendar` that routes day clicks to `/admin/[date]`.

`/admin/[date]` calls `supabase.rpc('admin_entries_for_date', { target_date })` and renders each entry as a card containing:
- Owner email + last-updated timestamp
- Content (preserving newlines via `whiteSpace: pre-wrap`)
- `VideoEmbed` for external `video_url` (YouTube/Vimeo/Loom)
- `<video src="/api/admin/video/{entry_id}">` for recorded Drive videos

## Video proxy

The recorded videos live in each user's personal Google Drive, uploaded under the `drive.file` OAuth scope. Admins do not have Drive access of their own to those files. The proxy at `/api/admin/video/[entryId]` solves this by acting on behalf of the entry owner:

1. Verifies the requester is logged in and in `admin_users` (returns 401/403 otherwise).
2. Reads the entry by id to get `user_id` (owner) and `recorded_video_drive_id`. The `admins_read_all_entries` RLS policy permits this.
3. Reads the owner's row from `user_google_tokens` (permitted by `admins_read_all_tokens`).
4. If `token_expires_at` is within 5 minutes of now, refreshes via the Google token endpoint using `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` + the owner's `refresh_token`, then writes the new token back (permitted by `admins_update_all_tokens`).
5. Forwards the client's `Range` header (if any) when calling `https://www.googleapis.com/drive/v3/files/{id}?alt=media` with `Authorization: Bearer <owner_token>`.
6. Streams the Drive response body back to the admin's `<video>` element, propagating `content-type`, `content-length`, `content-range`, and `accept-ranges`. Seeking works because Range requests are forwarded.

If Drive returns a non-OK status, the route returns `502 { error: 'drive_fetch_failed', status, body }` so the cause is visible.

## Admin-only UI on user dashboard

`app/(dashboard)/dashboard/page.tsx` calls `isAdmin(supabase, user.id)` and conditionally renders a `→ Admin: view all users` link below the calendar. Non-admins see nothing.

## Auth flow recap (relevant pieces)

Admins log in the same way as everyone else (Google Sign-In via Supabase OAuth, scope `drive.file`, `prompt: consent`, `access_type: offline`). Admin-ness is decided entirely by the `admin_users` table — there is no separate admin login, no separate role claim in the JWT, no separate auth route.

## Edge cases and known limitations

- **Owner never connected Drive**: if an entry has `recorded_video_drive_id` set but the owner deleted their `user_google_tokens` row, the proxy returns `404 { error: 'owner_has_no_drive_connection' }`.
- **Owner's refresh token revoked**: if Google rejects the refresh, the proxy returns `401 { error: 'token_refresh_failed' }` and the admin must contact that user to re-auth.
- **Drive file deleted by owner**: returns `502 { error: 'drive_fetch_failed', status: 404, body }`. The DB still has the stale `recorded_video_drive_id`; not auto-cleaned.
- **Multiple admins**: supported. The check is membership in `admin_users`; there is no "primary admin".
- **Non-admin trying to call the proxy directly**: returns `403`. Trying to reach `/admin` or `/admin/[date]` returns `notFound()` (Next.js 404 page) — chosen over a redirect so the route's existence is not advertised.
- **Service role key**: not used anywhere in this feature. All admin reads go through the user's session + RLS + SECURITY DEFINER RPCs.

## How to grant or revoke admin

Grant (run in Supabase SQL editor):
```sql
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'you@example.com';
```

Revoke:
```sql
DELETE FROM admin_users
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'you@example.com');
```

## File map for a new chat

If you are picking this up cold, the four files that define the entire admin surface are:

1. `supabase/migrations/004_admin.sql` — schema, RLS, RPCs
2. `lib/admin.ts` — `isAdmin()` helper used by all admin routes
3. `app/(dashboard)/admin/page.tsx` + `app/(dashboard)/admin/[date]/page.tsx` — server components
4. `app/api/admin/video/[entryId]/route.ts` — Drive video proxy

The user-facing `Calendar` in `components/journal/Calendar.tsx` is unchanged; `components/journal/AdminCalendar.tsx` is a near-duplicate that routes clicks to `/admin/[date]` instead of `/entry/[date]`. Consolidating them is a possible cleanup but currently kept separate to keep client-only concerns clear.
