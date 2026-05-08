---
title: Architecture
source_files: [middleware.ts, app/layout.tsx, app/page.tsx, app/(dashboard)/layout.tsx, app/api/drive-token/route.ts, app/api/save-drive-video/route.ts, app/auth/callback/route.ts, lib/supabase/client.ts, lib/supabase/server.ts]
entry_points: [middleware, createClient (browser), createClient (server), /api/drive-token, /api/save-drive-video, /auth/callback]
last_verified: 2026-05-08
---

# Architecture

## Overview

A Next.js 14 App Router app backed by Supabase. Server logic runs in React Server Components, middleware, API route handlers, and Supabase's hosted Postgres.

```
Browser
  └── Next.js 14 App Router (Vercel)
        ├── middleware.ts           — session refresh + route guard (runs before every request)
        ├── (auth) route group      — /login, /signup (public)
        ├── (dashboard) route group — /dashboard, /entry/[date] (protected)
        ├── /auth/callback          — Google OAuth exchange, stores Drive tokens
        └── /api/                   — drive-token (GET), save-drive-video (POST)
              └── Supabase (cloud)
                    ├── Auth     — Google OAuth, cookie-based sessions via @supabase/ssr
                    └── Postgres — journal_entries + user_google_tokens, Row Level Security
```

## Auth Flow

```
User clicks "Continue with Google"
  ↓
GoogleSignInButton → supabase.auth.signInWithOAuth({ provider: 'google', scopes: 'drive.file' })
  ↓
Google OAuth consent screen
  ↓
/auth/callback route
  ├── exchangeCodeForSession(code) — creates Supabase session
  ├── extracts Google access_token + refresh_token from provider_token fields
  ├── upserts user_google_tokens (preserves refresh token if not re-issued)
  └── redirects to /dashboard
  ↓
middleware.ts (runs on every non-static request)
  ├── getUser() — validates JWT server-side (NOT getSession(), which is spoofable)
  ├── no user + protected route → redirect to /login
  └── authenticated user + /login or /signup → redirect to /dashboard
  ↓
Route handler executes
  ├── Server Component: lib/supabase/server.ts createClient()
  │     reads cookies via next/headers cookies()
  │     used for data fetching — SELECT queries for the logged-in user
  │
  └── Client Component: lib/supabase/client.ts createClient()
        browser-only, no cookie access
        used for mutations — upsert entries, sign out
```

## Route Map

| Route | Protection | Type | Purpose |
|---|---|---|---|
| `/` | Middleware redirect | Server Component | Trampoline — redirects to /dashboard or /login |
| `/login` | Public | Client Component | Google OAuth sign-in |
| `/signup` | Public | Client Component | Google OAuth sign-up |
| `/auth/callback` | Public | Route Handler | Exchange Google OAuth code for session |
| `/dashboard` | Middleware guard | Server Component | Calendar view of all entries |
| `/entry/[date]` | Middleware guard | Server + Client | Read and edit a single journal entry |
| `/api/drive-token` | API (auth check inside) | Route Handler | Return refreshed Google Drive access token |
| `/api/save-drive-video` | API (auth check inside) | Route Handler | Write Drive file ID to journal entry |

## Supabase Client Split

Two separate factory functions exist because Next.js App Router has two execution contexts:

**`lib/supabase/server.ts`** — for Server Components and middleware.
Uses `createServerClient` from `@supabase/ssr`. Reads auth cookies via `next/headers cookies()`. The `setAll` handler wraps in try/catch because server components cannot set cookies — only middleware can. This is by design.

**`lib/supabase/client.ts`** — for Client Components (`'use client'`).
Uses `createBrowserClient`. No cookie handling — the browser SDK manages sessions internally.

Do not import `lib/supabase/server.ts` from any Client Component. It depends on `next/headers`, which is server-only.

## Key Design Decisions

- **Middleware is the only auth guard.** The dashboard layout has no auth check — it trusts that middleware already blocked unauthenticated access.
- **`getUser()` only.** The codebase never uses `getSession()` for auth decisions. `getSession()` reads the cookie without server-side JWT verification and can be spoofed.
- **One entry per user per day.** Enforced by a `UNIQUE(user_id, entry_date)` constraint. Saves use `upsert` with `onConflict: 'user_id,entry_date'`.
- **Drive tokens stored server-side.** Google access/refresh tokens live in `user_google_tokens` (Supabase Postgres with RLS), never in localStorage or cookies. The browser never sees a refresh token.
- **Drive scope is `drive.file`.** The app can only access files it created, not the user's full Drive.
