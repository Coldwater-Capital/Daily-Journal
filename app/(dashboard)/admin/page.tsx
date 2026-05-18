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
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-2xl font-bold" style={{ color: '#F3ECE3' }}>Admin · All Users</h1>
      <AdminCalendar entryDates={entryDates} />
    </div>
  )
}
