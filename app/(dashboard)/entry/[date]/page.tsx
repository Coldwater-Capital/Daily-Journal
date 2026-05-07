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
    .select('*')
    .eq('user_id', user.id)
    .eq('entry_date', date)
    .single()

  return (
    <div className="w-full max-w-4xl mx-auto px-8 py-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#F3ECE3' }}>{formatDateDisplay(date)}</h1>
      <EntryEditor
        initialContent={entry?.content ?? null}
        initialVideoUrl={entry?.video_url ?? null}
        userId={user.id}
        date={date}
      />
    </div>
  )
}
