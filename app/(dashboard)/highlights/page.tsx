import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { listExtras } from '@/lib/extras'
import ExtrasList from '@/components/journal/ExtrasList'

export const dynamic = 'force-dynamic'

export default async function HighlightsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const items = await listExtras(supabase, 'highlights', user.id)

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard" className="text-sm self-start text-neutral-600 hover:text-neutral-900">
        ← Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold text-neutral-900">All highlights</h1>
      <ExtrasList items={items} accentClass="text-amber-700" emptyMessage="No highlights yet." />
    </div>
  )
}
