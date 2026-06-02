import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { listExtras } from '@/lib/extras'
import ExtrasList from '@/components/journal/ExtrasList'

export const dynamic = 'force-dynamic'

export default async function SkillsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const items = await listExtras(supabase, 'skills', user.id)

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard" className="text-sm self-start text-neutral-600 hover:text-neutral-900">
        ← Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold text-neutral-900">All new skills</h1>
      <ExtrasList items={items} accentClass="text-emerald-700" emptyMessage="No new skills logged yet." />
    </div>
  )
}
