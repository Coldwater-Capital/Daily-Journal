import type { SupabaseClient } from '@supabase/supabase-js'

export interface ExtraItem {
  id: string
  text: string
  entry_date: string
  created_at: string
}

export type ExtraKind = 'highlights' | 'skills'

export async function listExtras(
  supabase: SupabaseClient,
  kind: ExtraKind,
  userId: string,
  filter?: { date?: string; monthStart?: string; monthEnd?: string },
): Promise<ExtraItem[]> {
  let query = supabase
    .from(kind)
    .select('id, text, entry_date, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (filter?.date) {
    query = query.eq('entry_date', filter.date)
  } else if (filter?.monthStart && filter?.monthEnd) {
    query = query.gte('entry_date', filter.monthStart).lte('entry_date', filter.monthEnd)
  }

  const { data } = await query
  return data ?? []
}

export async function addExtra(
  supabase: SupabaseClient,
  kind: ExtraKind,
  userId: string,
  entryDate: string,
  text: string,
): Promise<ExtraItem | null> {
  const trimmed = text.trim()
  if (!trimmed) return null
  const { data } = await supabase
    .from(kind)
    .insert({ user_id: userId, entry_date: entryDate, text: trimmed })
    .select('id, text, entry_date, created_at')
    .single()
  return data
}

export async function deleteExtra(
  supabase: SupabaseClient,
  kind: ExtraKind,
  id: string,
): Promise<void> {
  await supabase.from(kind).delete().eq('id', id)
}
