---
title: Frontend
source_files: [app/(dashboard)/dashboard/page.tsx, app/(dashboard)/entry/[date]/page.tsx, components/journal/Calendar.tsx, components/journal/EntryEditor.tsx, components/journal/VoiceRecorder.tsx, components/journal/VideoEmbed.tsx, components/ui/Navbar.tsx, components/ui/SaveIndicator.tsx, lib/utils.ts]
entry_points: [/dashboard, /entry/[date], Calendar, EntryEditor, VoiceRecorder, VideoEmbed]
last_verified: 2026-05-07
---

# Frontend

## Component Tree

```
(dashboard)/layout.tsx
  └── Navbar
  └── {children}
        ├── /dashboard → dashboard/page.tsx (Server)
        │     └── Calendar (Client)
        └── /entry/[date] → entry/[date]/page.tsx (Server)
              └── EntryEditor (Client)
                    ├── SaveIndicator
                    ├── VoiceRecorder (dynamic, ssr: false)
                    └── VideoEmbed
```

## Pages

### `/dashboard` — `app/(dashboard)/dashboard/page.tsx`

Server Component. Fetches all `entry_date` values for the current user and passes them to `Calendar` as a `string[]`.

### `/entry/[date]` — `app/(dashboard)/entry/[date]/page.tsx`

Server Component. Validates the `date` param with a regex (`/^\d{4}-\d{2}-\d{2}$/`) and `isNaN` check — returns 404 if invalid. Queries the entry for that date. Passes `initialContent`, `initialVideoUrl`, `userId`, and `date` to `EntryEditor`. The entry may not exist yet; `EntryEditor` creates it on first save.

## Components

### `Calendar` — `components/journal/Calendar.tsx`

Client Component. Props: `entryDates: string[]`.

Wraps `react-day-picker`'s `DayPicker`. Converts date strings to `Date` objects using a hardcoded `T00:00:00` suffix to avoid timezone offset drift. Days with entries get a blue dot via the `.day-has-entry` CSS class (injected via `modifiersClassNames`). Clicking any day navigates to `/entry/YYYY-MM-DD`.

Import: `import 'react-day-picker/dist/style.css'` is required in this file.

### `EntryEditor` — `components/journal/EntryEditor.tsx`

Client Component. The core interactive component.

**Props:**
```typescript
{
  initialContent: string | null
  initialVideoUrl: string | null
  userId: string
  date: string  // 'YYYY-MM-DD'
}
```

**Auto-save logic:**
- Uses `useDebouncedCallback` (1000ms) from `use-debounce`
- Skips the initial render via a `useRef(true)` flag to avoid upserting empty content on page load
- Watches both `content` and `videoUrl` — a video URL change alone triggers a save
- Save status cycles: `idle` → `saving` → `saved` (2s) → `idle`
- Upserts via browser Supabase client with `onConflict: 'user_id,entry_date'`

**VoiceRecorder** is dynamically imported with `ssr: false`:
```typescript
const VoiceRecorder = dynamic(() => import('@/components/journal/VoiceRecorder'), { ssr: false })
```
This prevents SSR errors from the Web Speech API `window` check.

`onTranscript` appends text: `setContent(prev => prev + transcript)`. Never replaces.

### `VoiceRecorder` — `components/journal/VoiceRecorder.tsx`

Client Component. Props: `onTranscript: (text: string) => void`.

Uses the browser's Web Speech API (`window.SpeechRecognition || window.webkitSpeechRecognition`). Shows a fallback message if the API is unavailable (Firefox, Safari).

**Ref-based listening pattern** — critical design choice:
- `isListening` (useState) drives the button UI only
- `isListeningRef` (useRef) is what the `onend` and `onerror` callbacks read
- Without the ref, callbacks capture stale state and the auto-restart logic fails

Config: `continuous: true`, `interimResults: true`, `lang: 'en-US'`.

`onend` fires after ~60s of silence. If `isListeningRef.current` is still true, it calls `recognition.start()` again to resume. This enables continuous listening without a manual button press.

Errors that stop listening: `'not-allowed'`, `'service-not-allowed'`, `'no-speech'`. These set both the ref and state to false to prevent an infinite restart loop.

Only final transcripts (not interim) are emitted via `onTranscript`, each with a trailing space.

### `VideoEmbed` — `components/journal/VideoEmbed.tsx`

Props: `url: string`. Calls `getEmbedUrl(url)` and renders an iframe if a valid embed URL is returned. Returns `null` silently for unrecognized URLs. The iframe uses Tailwind's `aspect-video` class (16:9) and allows autoplay and fullscreen.

### `Navbar` — `components/ui/Navbar.tsx`

Client Component. Displays "Journal" title and a sign-out button. Sign-out calls `supabase.auth.signOut()`, then `router.refresh()`, then navigates to `/login`.

### `SaveIndicator` — `components/ui/SaveIndicator.tsx`

Props: `status: 'idle' | 'saving' | 'saved'`. Returns null when idle. Shows "Saving..." in gray while saving, "Saved ✓" for 2 seconds after completion.

## Utilities — `lib/utils.ts`

### `getEmbedUrl(url: string): string | null`

Converts public video URLs to iframe embed sources.

| Input format | Output |
|---|---|
| `youtube.com/watch?v=ID` | `youtube.com/embed/ID` |
| `youtu.be/ID` | `youtube.com/embed/ID` |
| `youtube.com/shorts/ID` | `youtube.com/embed/ID` |
| `youtube.com/live/ID` | `youtube.com/embed/ID` |
| `vimeo.com/ID` | `player.vimeo.com/video/ID` |
| anything else | `null` |

Regex stops capture at `?` or `&` to prevent passing query params into the iframe src.

### `formatDateDisplay(dateStr: string): string`

Converts `'YYYY-MM-DD'` to a human-readable string like `"Thursday, May 7, 2026"` using `toLocaleDateString`. Subtracts 1 from the month because JS `Date` months are 0-indexed.

## Known Limitations

- **No error boundaries.** Supabase upsert failures in EntryEditor are silent.
- **Last write wins.** If the same entry is open in two tabs, the last auto-save overwrites the other.
- **Voice recording requires Chrome or Edge.** The Web Speech API is not supported in Firefox or Safari.
- **Video embed only.** No file uploads or image attachments.
