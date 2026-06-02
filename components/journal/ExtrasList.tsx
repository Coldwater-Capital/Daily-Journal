import Link from 'next/link'
import type { ExtraItem } from '@/lib/extras'

interface ExtrasListProps {
  items: ExtraItem[]
  accentClass: string
  emptyMessage: string
}

export default function ExtrasList({ items, accentClass, emptyMessage }: ExtrasListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-neutral-500 text-center py-8">{emptyMessage}</p>
  }

  const groups = groupByMonth(items)

  return (
    <div className="flex flex-col gap-8">
      {groups.map(g => (
        <section key={g.key}>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500 mb-3">
            {g.label}
          </h2>
          <ul className="flex flex-col gap-2">
            {g.items.map(item => {
              const d = new Date(item.entry_date + 'T00:00:00')
              const dateLabel = d.toLocaleString('en-US', { month: 'short', day: 'numeric' })
              return (
                <li key={item.id} className="flex items-baseline gap-3">
                  <span className={`text-xs font-medium w-14 shrink-0 ${accentClass}`}>{dateLabel}</span>
                  <Link
                    href={`/entry/${item.entry_date}`}
                    className="text-sm text-neutral-900 hover:underline"
                  >
                    {item.text}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

function groupByMonth(items: ExtraItem[]): { key: string; label: string; items: ExtraItem[] }[] {
  const map = new Map<string, ExtraItem[]>()
  for (const item of items) {
    const key = item.entry_date.slice(0, 7)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => {
      const [y, m] = key.split('-')
      const label = new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
      })
      return { key, label, items }
    })
}
