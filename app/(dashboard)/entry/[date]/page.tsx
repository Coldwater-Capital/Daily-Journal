import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import EntryEditor from '@/components/journal/EntryEditor'
import { formatDateDisplay } from '@/lib/utils'
import { listExtras } from '@/lib/extras'

interface EntryPageProps {
  params: { date: string }
}

export default async function EntryPage({ params }: EntryPageProps) {
  const { date } = params

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date).getTime())) {
    notFound()
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) notFound()

  const { data: entry } = await supabase
    .from('journal_entries')
    .select('content, video_url, recorded_video_drive_id')
    .eq('user_id', user.id)
    .eq('entry_date', date)
    .single()

  const { data: tokens } = await supabase
    .from('user_google_tokens')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  const [highlights, skills, allEntries] = await Promise.all([
    listExtras(supabase, 'highlights', user.id, { date }),
    listExtras(supabase, 'skills', user.id, { date }),
    supabase
      .from('journal_entries')
      .select('entry_date, content, video_url, recorded_video_drive_id')
      .eq('user_id', user.id),
  ])

  const populatedDates = (allEntries.data ?? [])
    .filter(e => e.content || e.video_url || e.recorded_video_drive_id)
    .map(e => e.entry_date as string)
    .sort()
  const prev = populatedDates.filter(d => d < date).pop() ?? null
  const next = populatedDates.find(d => d > date) ?? null

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-neutral-900">{formatDateDisplay(date)}</h1>
        <div className="flex items-center gap-2">
          {prev ? (
            <Link
              href={`/entry/${prev}`}
              className="text-sm px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
            >
              ← Prev
            </Link>
          ) : (
            <span className="text-sm px-3 py-1.5 rounded-md border border-neutral-200 text-neutral-300">← Prev</span>
          )}
          {next ? (
            <Link
              href={`/entry/${next}`}
              className="text-sm px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
            >
              Next →
            </Link>
          ) : (
            <span className="text-sm px-3 py-1.5 rounded-md border border-neutral-200 text-neutral-300">Next →</span>
          )}
        </div>
      </div>
      <EntryEditor
        initialContent={entry?.content ?? null}
        initialVideoUrl={entry?.video_url ?? null}
        initialDriveVideoId={entry?.recorded_video_drive_id ?? null}
        initialHighlights={highlights}
        initialSkills={skills}
        hasDriveConnected={!!tokens}
        userId={user.id}
        date={date}
      />
    </div>
  )
}
