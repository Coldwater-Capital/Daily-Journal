# Journaling App

A private daily journaling web app. Users create accounts, log in, and write entries navigated through a calendar. Each entry supports unlimited text, voice-to-text (Web Speech API), and an embedded YouTube or Vimeo video link.

**Stack:** Next.js 14 (App Router) · Supabase (auth + Postgres) · Tailwind CSS · TypeScript

## Quick Start

```bash
# 1. Copy and fill in env vars
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL and anon key

# 2. Install dependencies
npm install

# 3. Run the dev server
npm run dev
```

App runs at `http://localhost:3000`.

**Before the app works**, you must complete the Supabase setup — see [docs/operations.md](docs/operations.md#manual-setup-checklist-not-yet-done).

## Documentation

Full docs live in [docs/](docs/README.md):

- [Architecture](docs/architecture.md) — how the app is structured, auth flow
- [Database](docs/database.md) — schema, RLS, migration steps
- [Frontend](docs/frontend.md) — components, auto-save, voice recording
- [Integrations](docs/integrations.md) — Supabase setup, env vars
- [Operations](docs/operations.md) — setup checklist, deploy steps

## Development Commands

```bash
npm run dev        # Start local dev server
npm run build      # Production build
npm run lint       # ESLint
npx tsc --noEmit   # TypeScript type check
```
