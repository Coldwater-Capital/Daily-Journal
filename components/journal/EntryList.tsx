'use client'

import Link from 'next/link'

export interface EntryRow {
  entry_date: string
  content: string | null
}

interface EntryListProps {
  entries: EntryRow[]
  routeBase: string
  emptyMessage?: string
}

export default function EntryList({ entries, routeBase, emptyMessage }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-neutral-500 text-center py-8">
        {emptyMessage ?? 'No entries this month yet.'}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map(entry => {
        const d = new Date(entry.entry_date + 'T00:00:00')
        const dayName = d.toLocaleString('en-US', { weekday: 'short' })
        const dateLabel = d.toLocaleString('en-US', { month: 'short', day: 'numeric' })
        const snippet = (entry.content ?? '').replace(/\s+/g, ' ').trim().slice(0, 80)

        return (
          <Link
            key={entry.entry_date}
            href={`${routeBase}/${entry.entry_date}`}
            className="flex items-baseline gap-3 px-4 py-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors"
          >
            <span className="text-sm font-medium text-neutral-500 w-12 shrink-0">{dayName}</span>
            <span className="text-sm font-medium text-neutral-900 w-20 shrink-0">{dateLabel}</span>
            <span className="text-sm text-neutral-600 truncate">
              {snippet || <span className="italic text-neutral-400">no text</span>}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
