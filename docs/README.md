# Documentation Index

A private journaling web app built with Next.js 14, Supabase, and Tailwind CSS. Users write daily entries navigated through a calendar. Entries support text, voice-to-text, and embedded YouTube/Vimeo videos.

## Files

| File | Summary |
|---|---|
| [architecture.md](architecture.md) | System overview, route map, auth flow, Supabase client split |
| [database.md](database.md) | `journal_entries` schema, RLS policies, upsert pattern, setup steps |
| [frontend.md](frontend.md) | All components, auto-save logic, VoiceRecorder, video embed, utils |
| [integrations.md](integrations.md) | Supabase setup, env vars, Web Speech API, Vercel env requirements |
| [operations.md](operations.md) | Local dev, manual setup checklist, deploy steps, smoke tests |

## Start here if you want to...

| Task | Go to |
|---|---|
| Understand how the app is structured | [architecture.md](architecture.md) |
| Set up the Supabase database | [database.md](database.md#setup-manual--not-yet-done) |
| Understand how auto-save works | [frontend.md](frontend.md#entryeditor----componentsjournalentryeditortsx) |
| Find required environment variables | [integrations.md](integrations.md#supabase) |
| Deploy to Vercel | [operations.md](operations.md#vercel) |
| See what manual setup is still pending | [operations.md](operations.md#manual-setup-checklist-not-yet-done) |
