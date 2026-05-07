'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteJournalEntry(date: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('journal_entries')
    .delete()
    .eq('user_id', user.id)
    .eq('entry_date', date)
  revalidatePath('/dashboard')
}
