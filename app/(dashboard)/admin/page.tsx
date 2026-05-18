import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import AdminCalendar from '@/components/journal/AdminCalendar'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  if (!(await isAdmin(supabase, user.id))) notFound()

  const { data: rows } = await supabase.rpc('admin_all_entry_dates')
  const entryDates = (rows ?? []).map((r: { entry_date: string }) => r.entry_date)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-neutral-900">Admin · All Users</h1>
      <div className="flex justify-center">
        <AdminCalendar entryDates={entryDates} />
      </div>
      <p className="text-center text-sm text-neutral-500">
        Click any day to see every user&apos;s entry for that date
      </p>
    </div>
  )
}
