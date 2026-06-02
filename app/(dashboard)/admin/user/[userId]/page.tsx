import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

interface AdminUserPageProps {
  params: { userId: string }
}

interface UserEntry {
  entry_id: string
  entry_date: string
  content: string | null
  video_url: string | null
  recorded_video_drive_id: string | null
}

export default async function AdminUserPage({ params }: AdminUserPageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  if (!(await isAdmin(supabase, user.id))) notFound()

  if (!/^[0-9a-f-]{36}$/i.test(params.userId)) notFound()

  const { data } = await supabase.rpc('admin_entries_for_user', { target_user_id: params.userId })
  const entries = (data ?? []) as UserEntry[]

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin" className="text-sm self-start text-neutral-600 hover:text-neutral-900">
        ← Back to admin
      </Link>
      <h1 className="text-2xl font-bold text-neutral-900">User entries</h1>

      {entries.length === 0 ? (
        <p className="text-sm text-neutral-500">No entries for this user yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map(entry => {
            const d = new Date(entry.entry_date + 'T00:00:00')
            const dayName = d.toLocaleString('en-US', { weekday: 'short' })
            const dateLabel = d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            const snippet = (entry.content ?? '').replace(/\s+/g, ' ').trim().slice(0, 100)
            return (
              <Link
                key={entry.entry_id}
                href={`/admin/${entry.entry_date}`}
                className="flex items-baseline gap-3 px-4 py-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors"
              >
                <span className="text-sm font-medium text-neutral-500 w-12 shrink-0">{dayName}</span>
                <span className="text-sm font-medium text-neutral-900 w-32 shrink-0">{dateLabel}</span>
                <span className="text-sm text-neutral-600 truncate">
                  {snippet || <span className="italic text-neutral-400">no text</span>}
                </span>
              </Link>
            )
          })}
        </ul>
      )}
    </div>
  )
}
