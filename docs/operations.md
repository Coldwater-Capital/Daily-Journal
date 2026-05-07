---
title: Operations
source_files: [package.json, next.config.mjs, tailwind.config.ts]
entry_points: [npm run dev, npm run build, npm run lint]
last_verified: 2026-05-07
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

## Manual Setup Checklist (not yet done)

These steps require human action and cannot be automated:

### Supabase

- [ ] Create a Supabase project at supabase.com
- [ ] Copy Project URL and anon key into `journaling-app/.env.local`
- [ ] Run `supabase/migrations/001_initial.sql` in Supabase SQL Editor
- [ ] Verify `journal_entries` table exists with RLS enabled (shield icon in Table Editor)
- [ ] Disable email confirmation: Auth → Email → uncheck "Confirm email"
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
- [ ] Trigger deploy
- [ ] Add the Vercel production URL to Supabase Auth redirect URLs

## Post-Deploy Smoke Tests

Run these after the first Vercel deploy:

- [ ] Sign up with a test email → lands on `/dashboard`
- [ ] Log in → lands on `/dashboard`
- [ ] Forgot password → reset email arrives → new password works
- [ ] Type in an entry → "Saving..." then "Saved ✓" appears → hard-refresh → content preserved
- [ ] Navigate two months forward and back on the calendar
- [ ] Click a date → entry page opens for that date
- [ ] Paste a YouTube URL → embed renders
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
