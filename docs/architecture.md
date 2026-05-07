---
title: Architecture
source_files: [middleware.ts, app/layout.tsx, app/page.tsx, app/(dashboard)/layout.tsx, lib/supabase/client.ts, lib/supabase/server.ts]
entry_points: [middleware, createClient (browser), createClient (server)]
last_verified: 2026-05-07
---

# Architecture

## Overview

A Next.js 14 App Router single-page app backed by Supabase. No separate backend service. All server logic runs in React Server Components, middleware, and Supabase's hosted Postgres.

```
Browser
  └── Next.js 14 App Router (Vercel)
        ├── middleware.ts          — session refresh + route guard (runs before every request)
        ├── (auth) route group     — /login, /signup, /reset-password, /update-password (public)
        └── (dashboard) route group — /dashboard, /entry/[date] (protected)
              └── Supabase (cloud)
                    ├── Auth       — email/password, cookie-based sessions via @supabase/ssr
                    └── Postgres   — journal_entries table with Row Level Security
```

## Auth Flow

```
Incoming request
  ↓
middleware.ts (runs on every non-static request)
  ├── createServerClient with cookies from request headers
  ├── getUser() — validates JWT server-side (NOT getSession(), which is spoofable)
  ├── public routes: /login, /signup, /reset-password, /update-password → pass through
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
        used for mutations — upsert entries, signOut
```

## Route Map

| Route | Protection | Type | Purpose |
|---|---|---|---|
| `/` | Middleware redirect | Server Component | Trampoline — redirects to /dashboard or /login |
| `/login` | Public | Client Component | Email/password login |
| `/signup` | Public | Client Component | Account creation |
| `/reset-password` | Public | Client Component | Send password reset email |
| `/update-password` | Public | Client Component | Set new password after reset link |
| `/dashboard` | Middleware guard | Server Component | Calendar view of all entries |
| `/entry/[date]` | Middleware guard | Server + Client | Read and edit a single journal entry |

## Supabase Client Split

Two separate factory functions exist because Next.js App Router has two execution contexts:

**`lib/supabase/server.ts`** — for Server Components and middleware.
Uses `createServerClient` from `@supabase/ssr`. Reads auth cookies via `next/headers cookies()`. The `setAll` handler wraps in try/catch because server components cannot set cookies — only middleware can. This is by design.

**`lib/supabase/client.ts`** — for Client Components (`'use client'`).
Uses `createBrowserClient`. No cookie handling — the browser SDK manages sessions internally.

Do not import `lib/supabase/server.ts` from any Client Component. It depends on `next/headers`, which is server-only.

## Key Design Decisions

- **No separate API routes.** Data fetching happens in Server Components directly. Mutations happen in Client Components using the browser Supabase client.
- **Middleware is the only auth guard.** The dashboard layout has no auth check — it trusts that middleware already blocked unauthenticated access.
- **`getUser()` only.** The codebase never uses `getSession()` for auth decisions. `getSession()` reads the cookie without server-side JWT verification and can be spoofed.
- **One entry per user per day.** Enforced by a `UNIQUE(user_id, entry_date)` constraint. Saves use `upsert` with `onConflict: 'user_id,entry_date'`.
