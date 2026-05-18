import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import { formatDateDisplay } from '@/lib/utils'
import { colorForUserId } from '@/lib/palette'
import VideoEmbed from '@/components/journal/VideoEmbed'

export const dynamic = 'force-dynamic'

interface AdminDayPageProps {
  params: { date: string }
}

interface AdminEntry {
  entry_id: string
  user_id: string
  user_email: string
  content: string | null
  video_url: string | null
  recorded_video_drive_id: string | null
  updated_at: string
}

export default async function AdminDayPage({ params }: AdminDayPageProps) {
  const { date } = params

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date).getTime())) {
    notFound()
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  if (!(await isAdmin(supabase, user.id))) notFound()

  const { data } = await supabase.rpc('admin_entries_for_date', { target_date: date })
  const entries: AdminEntry[] = data ?? []

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Link
        href="/admin"
        className="text-sm inline-block mb-4 text-neutral-600 hover:text-neutral-900 transition-colors"
      >
        ← Back to admin calendar
      </Link>

      <h1 className="text-2xl font-bold mb-6 text-neutral-900">
        {formatDateDisplay(date)}
      </h1>

      {entries.length === 0 && (
        <p className="text-neutral-500">No entries from any user on this date.</p>
      )}

      <div className="flex flex-col gap-6">
        {entries.map(entry => {
          const palette = colorForUserId(entry.user_id)
          return (
            <div
              key={entry.entry_id}
              className="rounded-xl p-5"
              style={{ background: palette.bg, border: `1px solid ${palette.border}` }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold" style={{ color: palette.text }}>
                  {entry.user_email}
                </span>
                <span className="text-xs" style={{ color: palette.text, opacity: 0.6 }}>
                  updated {new Date(entry.updated_at).toLocaleString()}
                </span>
              </div>

              {entry.content && (
                <p
                  className="text-sm leading-relaxed mb-4"
                  style={{ color: palette.text, whiteSpace: 'pre-wrap' }}
                >
                  {entry.content}
                </p>
              )}

              {entry.video_url && <VideoEmbed url={entry.video_url} />}

              {entry.recorded_video_drive_id && (
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-widest mb-2" style={{ color: palette.accent }}>
                    Recorded video
                  </p>
                  <video
                    src={`/api/admin/video/${entry.entry_id}`}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full rounded-xl"
                    style={{ aspectRatio: '16/9', background: '#000', border: `1px solid ${palette.border}` }}
                  />
                </div>
              )}

              {!entry.content && !entry.video_url && !entry.recorded_video_drive_id && (
                <p className="text-sm italic" style={{ color: palette.text, opacity: 0.6 }}>
                  Empty entry.
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
