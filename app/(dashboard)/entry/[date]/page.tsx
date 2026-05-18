import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EntryEditor from '@/components/journal/EntryEditor'
import { formatDateDisplay } from '@/lib/utils'

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

  // Check if this user has Google Drive connected
  const { data: tokens } = await supabase
    .from('user_google_tokens')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-neutral-900">{formatDateDisplay(date)}</h1>
      <EntryEditor
        initialContent={entry?.content ?? null}
        initialVideoUrl={entry?.video_url ?? null}
        initialDriveVideoId={entry?.recorded_video_drive_id ?? null}
        hasDriveConnected={!!tokens}
        userId={user.id}
        date={date}
      />
    </div>
  )
}
