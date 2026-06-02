import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import AdminView, { type AdminEntryRow, type AdminUserRow } from '@/components/journal/AdminView'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  if (!(await isAdmin(supabase, user.id))) notFound()

  const [datesRes, entriesRes, usersRes] = await Promise.all([
    supabase.rpc('admin_all_entry_dates'),
    supabase.rpc('admin_all_entries'),
    supabase.rpc('admin_users_with_counts'),
  ])

  const entryDates = (datesRes.data ?? []).map((r: { entry_date: string }) => r.entry_date)
  const allEntries = (entriesRes.data ?? []) as AdminEntryRow[]
  const users = (usersRes.data ?? []) as AdminUserRow[]

  return <AdminView entryDates={entryDates} allEntries={allEntries} users={users} />
}
