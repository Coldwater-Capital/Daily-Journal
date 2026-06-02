import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/journal/DashboardShell'
import { isAdmin } from '@/lib/admin'
import { calculateStats } from '@/lib/stats'
import { STAT_CARDS } from '@/lib/palette'
import { listExtras } from '@/lib/extras'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? ''

  const [{ data: entryRows }, highlights, skills] = await Promise.all([
    supabase
      .from('journal_entries')
      .select('entry_date, content, video_url, recorded_video_drive_id')
      .eq('user_id', userId),
    listExtras(supabase, 'highlights', userId),
    listExtras(supabase, 'skills', userId),
  ])

  const populated = (entryRows ?? []).filter(
    e => e.content || e.video_url || e.recorded_video_drive_id,
  )
  const entries = populated.map(e => ({
    entry_date: e.entry_date as string,
    content: (e.content as string | null) ?? null,
  }))
  const entryDates = entries.map(e => e.entry_date)
  const starDates = Array.from(new Set(highlights.map(h => h.entry_date)))

  const { streak, thisMonth, allTime } = calculateStats(entryDates)
  const admin = user ? await isAdmin(supabase, user.id) : false

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Current streak" value={streak} unit="days" colors={STAT_CARDS.streak} />
        <StatCard label="This month" value={thisMonth} unit="entries" colors={STAT_CARDS.month} />
        <StatCard label="All time" value={allTime} unit="entries" colors={STAT_CARDS.all} />
      </div>

      <DashboardShell
        entries={entries}
        highlights={highlights}
        skills={skills}
        starDates={starDates}
        routeBase="/entry"
      />

      <div className="flex flex-col items-center gap-2 text-sm text-neutral-500">
        <p>Click any day to open or create an entry</p>
        {admin && (
          <Link href="/admin" className="text-neutral-700 hover:text-neutral-900 underline">
            → Admin: view all users
          </Link>
        )}
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  unit: string
  colors: { bg: string; border: string; label: string; number: string; unit: string }
}

function StatCard({ label, value, unit, colors }: StatCardProps) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
    >
      <p className="text-sm font-medium mb-3" style={{ color: colors.label }}>{label}</p>
      <p className="flex items-baseline gap-2">
        <span className="text-3xl font-bold" style={{ color: colors.number }}>{value}</span>
        <span className="text-sm" style={{ color: colors.unit }}>{unit}</span>
      </p>
    </div>
  )
}
