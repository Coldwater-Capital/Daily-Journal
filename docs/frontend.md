---
title: Frontend
source_files: [app/(dashboard)/dashboard/page.tsx, app/(dashboard)/entry/[date]/page.tsx, app/(dashboard)/layout.tsx, components/auth/GoogleSignInButton.tsx, components/auth/LoginForm.tsx, components/auth/SignupForm.tsx, components/journal/Calendar.tsx, components/journal/EntryEditor.tsx, components/journal/VideoRecorder.tsx, components/journal/VoiceRecorder.tsx, components/journal/VideoEmbed.tsx, components/ui/Navbar.tsx, components/ui/SaveIndicator.tsx, components/ui/BackButton.tsx, lib/utils.ts]
entry_points: [/dashboard, /entry/[date], Calendar, EntryEditor, VideoRecorder, VoiceRecorder]
last_verified: 2026-05-08
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
                    ├── BackButton
                    ├── SaveIndicator
                    ├── VoiceRecorder (dynamic, ssr: false)
                    ├── VideoEmbed
                    └── VideoRecorder (dynamic, ssr: false)
```

## Pages

### `/dashboard` — `app/(dashboard)/dashboard/page.tsx`

Server Component. Fetches all `entry_date` values for the current user where any content column is non-null, then passes them to `Calendar` as a `string[]`. The query includes all three content types:

```typescript
.or('content.not.is.null,video_url.not.is.null,recorded_video_drive_id.not.is.null')
```

An entry with only a Drive video (no text, no URL) still appears as a dot on the calendar.

### `/entry/[date]` — `app/(dashboard)/entry/[date]/page.tsx`

Server Component. Validates the `date` param, then fetches:
1. The journal entry (`content`, `video_url`, `recorded_video_drive_id`)
2. Whether the user has Google Drive connected (queries `user_google_tokens`)

Passes all fields plus `hasDriveConnected` to `EntryEditor`. The entry may not exist yet — `EntryEditor` creates it on first save.

## Components

### `Calendar` — `components/journal/Calendar.tsx`

Client Component. Props: `entryDates: string[]`.

Wraps `react-day-picker`'s `DayPicker`. Converts date strings to `Date` objects using a `T00:00:00` suffix to avoid timezone offset drift. Days with entries show a dot indicator via the `.day-has-entry` CSS class. Clicking any day navigates to `/entry/YYYY-MM-DD`.

The calendar uses CSS `zoom` for scaling and is centered on the page via the parent flex container.

### `EntryEditor` — `components/journal/EntryEditor.tsx`

Client Component. The core interactive component.

**Props:**
```typescript
{
  initialContent: string | null
  initialVideoUrl: string | null
  initialDriveVideoId: string | null   // Google Drive file ID, if a recording exists
  hasDriveConnected: boolean           // whether to show VideoRecorder
  userId: string
  date: string  // 'YYYY-MM-DD'
}
```

**Auto-save logic:**
- Uses `useDebouncedCallback` (1000ms) from `use-debounce`
- Skips the initial render via a `useRef(true)` flag to avoid upserting empty content on page load
- Watches both `content` and `videoUrl` — a URL change alone triggers a save
- Save status cycles: `idle` → `saving` → `saved` (2s) → `idle`
- Upserts via browser Supabase client with `onConflict: 'user_id,entry_date'`
- `recorded_video_drive_id` is NOT written by the debounced save — it is written by `/api/save-drive-video` when a Drive upload completes

**Back button behavior:** If the user navigates back with no content, no video URL, and no Drive video, and the entry existed before, it is deleted from the database.

**Dynamic imports** (both require window access):
```typescript
const VoiceRecorder = dynamic(() => import('@/components/journal/VoiceRecorder'), { ssr: false })
const VideoRecorder = dynamic(() => import('@/components/journal/VideoRecorder'), { ssr: false })
```

### `VideoRecorder` — `components/journal/VideoRecorder.tsx`

Client Component. Records webcam video, previews it, uploads to Google Drive, and renders the saved video via a Drive embed iframe.

**Props:**
```typescript
{
  date: string
  existingDriveId: string | null
  hasDriveConnected: boolean
  onVideoSaved: (driveId: string) => void
  onVideoDeleted: () => void
}
```

If `hasDriveConnected` is false, renders a "Sign in with Google to record videos" message.

**Recording flow:**
1. User clicks record → `getUserMedia({ video: true, audio: true })`
2. `MediaRecorder` collects chunks; MIME type detection tries `video/webm;codecs=vp9,opus` → `video/webm` → `video/mp4`
3. On stop: combines chunks into a Blob, shows preview with `<video controls>`
4. User clicks "Save to Drive" → fetches token from `/api/drive-token`
5. If a previous recording exists, deletes the old Drive file first
6. Uploads via multipart POST to `https://www.googleapis.com/upload/drive/v3/files`
7. Calls `/api/save-drive-video` to store the new Drive file ID in the database
8. Calls `onVideoSaved(driveId)` — state bubbles up to `EntryEditor`

**After save:** Renders a `<iframe src="https://drive.google.com/file/d/{driveId}/preview">`.

**Deletion:** Calls Drive API DELETE, then `/api/save-drive-video` with `driveId: null`, then `onVideoDeleted()`.

### `VoiceRecorder` — `components/journal/VoiceRecorder.tsx`

Client Component. Props: `onTranscript: (text: string) => void`.

Uses `window.SpeechRecognition || window.webkitSpeechRecognition`. Shows a fallback if unavailable.

**Ref-based listening pattern:**
- `isListening` (useState) drives the button UI only
- `isListeningRef` (useRef) is what `onend` and `onerror` callbacks read
- Without the ref, callbacks capture stale state and auto-restart logic fails

Config: `continuous: true`, `interimResults: true`. On `onend`, restarts if `isListeningRef.current` is true (handles the ~60s auto-stop).

Spoken punctuation markers are replaced inline: `"period"` → `.`, `"comma"` → `,`, `"new line"` → `\n`, etc. Text is smart-capitalized after sentence-ending punctuation. Only final results (not interim) are emitted.

### `VideoEmbed` — `components/journal/VideoEmbed.tsx`

Props: `url: string`. Calls `getEmbedUrl(url)` and renders an iframe if a valid embed URL is returned. Returns `null` for empty or unrecognized URLs. Uses `aspect-video` (16:9).

### `Navbar` — `components/ui/Navbar.tsx`

Client Component. Displays "Daily Journal" title (left) and a sign-out button (right) with symmetric 24px padding. Sign-out calls `supabase.auth.signOut()` then navigates to `/login`.

### `SaveIndicator` — `components/ui/SaveIndicator.tsx`

Props: `status: 'idle' | 'saving' | 'saved'`. Returns null when idle. Shows "Saving..." while saving, "Saved ✓" for 2 seconds after completion.

### `BackButton` — `components/ui/BackButton.tsx`

No props. Calls `router.push('/dashboard')` with a 500ms `router.refresh()` delay. Renders as a text button with a ← arrow.

### `GoogleSignInButton` — `components/auth/GoogleSignInButton.tsx`

Props: `label?: string` (default: `"Continue with Google"`).

Initiates Google OAuth via `supabase.auth.signInWithOAuth`. Requests `drive.file` scope with `access_type: 'offline'` and `prompt: 'consent'` to ensure a refresh token is always returned. Redirects to `/auth/callback` on success.

### `LoginForm` / `SignupForm` — `components/auth/`

Both render a `GoogleSignInButton` with a link to the other page. No email/password fields — authentication is Google-only.

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
| Loom URLs | Loom embed URL |
| anything else | `null` |

### `formatDateDisplay(dateStr: string): string`

Converts `'YYYY-MM-DD'` to a human-readable string like `"Thursday, May 8, 2026"`.

## Known Limitations

- **No error boundaries.** Supabase upsert failures in `EntryEditor` are silent.
- **Last write wins.** Same entry open in two tabs — last auto-save overwrites.
- **Voice recording requires Chrome or Edge.** Web Speech API unsupported in Firefox and Safari.
- **Drive upload is client-side.** Large videos may hit browser memory limits.
- **Drive scope is `drive.file`.** The app can only access files it created, not the user's full Drive.
