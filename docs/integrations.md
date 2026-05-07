---
title: Integrations
source_files: [lib/supabase/client.ts, lib/supabase/server.ts, middleware.ts, .env.local.example]
entry_points: [createClient (browser), createClient (server)]
last_verified: 2026-05-07
---

# Integrations

## Supabase

**Purpose:** Authentication (email/password) and database (Postgres with RLS).

**Package:** `@supabase/ssr` — do not use the legacy `@supabase/auth-helpers-nextjs`.

**Environment variables:**

| Variable | Where to find it | Used in |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API → Project URL | Browser and server clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API → anon/public | Browser and server clients |

Both are `NEXT_PUBLIC_` prefixed so they are available in browser bundles. They are safe to expose — Supabase RLS policies enforce data access.

**Local setup (`.env.local`):**
Copy `.env.local.example` to `.env.local` and fill in both values. This file is gitignored.

**Supabase dashboard settings that must be configured manually:**

| Setting | Location | Value |
|---|---|---|
| Email confirmation | Auth → Email → "Confirm email" | Disabled |
| Redirect URLs (local dev) | Auth → URL Configuration | `http://localhost:3000/**` |
| Redirect URLs (production) | Auth → URL Configuration | `https://your-app.vercel.app/**` |
| Redirect URLs (preview deploys) | Auth → URL Configuration | `https://*.vercel.app/**` |

**Auth methods used:**

| Operation | Supabase call |
|---|---|
| Login | `supabase.auth.signInWithPassword({ email, password })` |
| Signup | `supabase.auth.signUp({ email, password })` |
| Send reset email | `supabase.auth.resetPasswordForEmail(email, { redirectTo: '.../update-password' })` |
| Set new password | `supabase.auth.updateUser({ password })` |
| Sign out | `supabase.auth.signOut()` |

## Web Speech API

**Purpose:** Voice-to-text transcription in the entry editor.

**No API key required.** Runs entirely in the browser via the native `SpeechRecognition` or `webkitSpeechRecognition` interface.

**Browser support:** Chrome and Edge only. Firefox and Safari have no support. The VoiceRecorder component shows a fallback message when the API is unavailable.

## YouTube / Vimeo (embed only)

**Purpose:** Users paste a video URL; it renders as an embedded iframe.

**No API key required.** Embed URLs are constructed client-side from the pasted URL using `getEmbedUrl` in `lib/utils.ts`. No calls to YouTube or Vimeo APIs.

Supported URL formats: see [frontend.md](frontend.md#getembedurl).

## Vercel (deployment target)

**Purpose:** Hosting the Next.js app.

**Environment variables that must be set in Vercel before first deploy:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Set these in: Vercel project → Settings → Environment Variables. If they are missing on first build, the build will fail.
