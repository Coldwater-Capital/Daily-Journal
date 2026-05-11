import { createClient } from '@/lib/supabase/server'
import Calendar from '@/components/journal/Calendar'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: entries } = await supabase
    .from('journal_entries')
    .select('entry_date, content, video_url, recorded_video_drive_id')
    .eq('user_id', user?.id ?? '')

  const entryDates = (entries ?? [])
    .filter(e => e.content || e.video_url || e.recorded_video_drive_id)
    .map(e => e.entry_date as string)

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-2xl font-bold" style={{ color: '#F3ECE3' }}>Your Journal</h1>
      <Calendar entryDates={entryDates} />
    </div>
  )
}
