---
title: Integrations
source_files: [lib/supabase/client.ts, lib/supabase/server.ts, middleware.ts, app/api/drive-token/route.ts, app/api/save-drive-video/route.ts, components/auth/GoogleSignInButton.tsx, .env.local.example]
entry_points: [createClient (browser), createClient (server), /api/drive-token, /api/save-drive-video]
last_verified: 2026-05-08
---

# Integrations

## Supabase

**Purpose:** Authentication (Google OAuth) and database (Postgres with RLS).

**Package:** `@supabase/ssr` — do not use the legacy `@supabase/auth-helpers-nextjs`.

**Environment variables:**

| Variable | Where to find it | Used in |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API → Project URL | Browser and server clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API → anon/public | Browser and server clients |

Both are `NEXT_PUBLIC_` prefixed so they are available in browser bundles. They are safe to expose — Supabase RLS policies enforce data access.

**Local setup (`.env.local`):**
Copy `.env.local.example` to `.env.local` and fill in all values. This file is gitignored.

**Supabase dashboard settings that must be configured manually:**

| Setting | Location | Value |
|---|---|---|
| Redirect URLs (local dev) | Auth → URL Configuration | `http://localhost:3000/**` |
| Redirect URLs (production) | Auth → URL Configuration | `https://your-app.vercel.app/**` |
| Redirect URLs (preview deploys) | Auth → URL Configuration | `https://*.vercel.app/**` |
| Google OAuth provider | Auth → Providers → Google | Enable, paste `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` |

**Auth methods used:**

| Operation | Supabase call |
|---|---|
| Sign in / Sign up | `supabase.auth.signInWithOAuth({ provider: 'google', ... })` |
| Sign out | `supabase.auth.signOut()` |

## Google OAuth + Google Drive

**Purpose:** Sign in with Google, and optionally record webcam videos and save them to the user's Google Drive.

**Environment variables:**

| Variable | Where to find it | Used in |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Google Cloud Console → APIs & Services → Credentials | `/api/drive-token` |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → APIs & Services → Credentials | `/api/drive-token` |

**Google Cloud setup (manual):**

1. Go to console.cloud.google.com → Create or select a project
2. Enable the Google Drive API
3. Create OAuth 2.0 credentials (Web application type)
4. Add authorized redirect URIs:
   - `https://your-supabase-project.supabase.co/auth/v1/callback`
5. Copy the Client ID and Client Secret into `.env.local`
6. Also paste them into Supabase → Auth → Providers → Google

**OAuth scopes requested:**

- `https://www.googleapis.com/auth/drive.file` — creates and manages files the app created in the user's Drive

The `access_type: 'offline'` and `prompt: 'consent'` params are set on every sign-in to ensure a refresh token is always returned (required for background token refresh).

**Token lifecycle:**

1. User signs in → Google returns access + refresh tokens
2. App stores both in `user_google_tokens` table (via auth callback)
3. When recording a video, `GET /api/drive-token` is called
4. If the access token expires within 5 minutes, the route refreshes it via `https://oauth2.googleapis.com/token` and updates the database
5. The fresh access token is passed to the browser for the Drive upload

**API routes:**

### `GET /api/drive-token`

Returns a valid Google access token for the current user.

| Response | Meaning |
|---|---|
| `{ accessToken: string }` | Success |
| `401 Unauthorized` | No session |
| `404 no_drive_connection` | User has not connected Google Drive |
| `401 no_refresh_token` | Token expired but no refresh token stored |
| `401 token_refresh_failed` | Google token refresh call failed |

### `POST /api/save-drive-video`

Writes a Drive file ID to the current user's journal entry for a given date.

Request body: `{ driveId: string | null, date: string }`. Pass `driveId: null` to clear a deleted video.

## Web Speech API

**Purpose:** Voice-to-text transcription in the entry editor.

**No API key required.** Runs in the browser via `SpeechRecognition` / `webkitSpeechRecognition`.

**Browser support:** Chrome and Edge only. Firefox and Safari are not supported. `VoiceRecorder` shows a fallback message when unavailable.

## YouTube / Vimeo / Loom (embed only)

**Purpose:** Users paste a video URL; it renders as an embedded iframe.

**No API key required.** Embed URLs are constructed client-side using `getEmbedUrl` in `lib/utils.ts`.

Supported formats: see [frontend.md](frontend.md#videoembed----componentsjournalvideoembed).

## Vercel (deployment target)

**Purpose:** Hosting the Next.js app.

**Environment variables that must be set in Vercel before first deploy:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Set these in: Vercel project → Settings → Environment Variables. Missing values on first build will cause the build to fail.
