---
title: Operations
source_files: [package.json, next.config.mjs, tailwind.config.ts]
entry_points: [npm run dev, npm run build, npm run lint]
last_verified: 2026-05-08
---

# Operations

## Local Development

### Prerequisites

- Node.js installed (`node -v` to verify)
- A Supabase project created (see [integrations.md](integrations.md))
- `.env.local` filled in with Supabase URL and anon key

### Start dev server

```bash
cd journaling-app
npm run dev
```

App available at `http://localhost:3000`.

### Verify code before pushing

```bash
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript type check
```

## Manual Setup Checklist

These steps require human action and cannot be automated:

### Google Cloud (for OAuth + Drive)

- [ ] Go to console.cloud.google.com → create or select a project
- [ ] Enable the Google Drive API (APIs & Services → Library)
- [ ] Create OAuth 2.0 credentials (APIs & Services → Credentials → Create → OAuth client ID → Web application)
- [ ] Add authorized redirect URI: `https://your-supabase-project.supabase.co/auth/v1/callback`
- [ ] Copy Client ID and Client Secret into `.env.local` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### Supabase

- [ ] Create a Supabase project at supabase.com
- [ ] Copy Project URL and anon key into `journaling-app/.env.local`
- [ ] Run `supabase/migrations/001_initial.sql` in Supabase SQL Editor
- [ ] Run `supabase/migrations/002_google_drive.sql` in Supabase SQL Editor
- [ ] Verify both tables exist with RLS enabled (shield icon in Table Editor)
- [ ] Enable Google OAuth provider: Auth → Providers → Google → paste Client ID and Client Secret
- [ ] Add redirect URL `http://localhost:3000/**` in Auth → URL Configuration
- [ ] Add redirect URL `https://your-app.vercel.app/**` in Auth → URL Configuration
- [ ] Add redirect URL `https://*.vercel.app/**` in Auth → URL Configuration (covers preview deploys)

### GitHub

- [ ] Create a new GitHub repository
- [ ] Push `journaling-app/` — confirm `.env.local` is gitignored (it is)

### Vercel

- [ ] Import the GitHub repo at vercel.com/new
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` in Vercel → Settings → Environment Variables **before first deploy**
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel → Settings → Environment Variables **before first deploy**
- [ ] Set `GOOGLE_CLIENT_ID` in Vercel → Settings → Environment Variables **before first deploy**
- [ ] Set `GOOGLE_CLIENT_SECRET` in Vercel → Settings → Environment Variables **before first deploy**
- [ ] Trigger deploy
- [ ] Add the Vercel production URL to Supabase Auth redirect URLs
- [ ] Add the Vercel production URL to Google Cloud OAuth authorized redirect URIs

## Post-Deploy Smoke Tests

Run these after the first Vercel deploy:

- [ ] Sign in with Google → lands on `/dashboard`
- [ ] Sign out → redirected to `/login`
- [ ] Type in an entry → "Saving..." then "Saved ✓" appears → hard-refresh → content preserved
- [ ] Navigate two months forward and back on the calendar
- [ ] Click a date → entry page opens for that date
- [ ] Paste a YouTube URL → embed renders
- [ ] Record a short webcam video → uploads to Drive → preview iframe appears
- [ ] Delete entry content → navigate back → dot disappears from calendar
- [ ] Open two browsers as different users → each user sees only their own entries
- [ ] Navigate to `/entry/not-a-date` → 404 page

## Stack Versions

| Package | Version | Notes |
|---|---|---|
| Next.js | 14.2.35 | Do NOT upgrade — pinned intentionally |
| React | ^18 | |
| TypeScript | ^5 | |
| Tailwind CSS | ^3.4.1 | |
| `@supabase/ssr` | ^0.10.2 | Use this, not the legacy auth helpers |
| `@supabase/supabase-js` | ^2.105.3 | |
| `react-day-picker` | ^9.14.0 | v9 — import `react-day-picker/dist/style.css` |
| `use-debounce` | ^10.1.1 | |
