import Link from 'next/link'
import type { ExtraItem } from '@/lib/extras'

interface ExtrasCardProps {
  title: string
  items: ExtraItem[]
  href: string
  emptyHint: string
  accentClass: string
}

export default function ExtrasCard({ title, items, href, emptyHint, accentClass }: ExtrasCardProps) {
  return (
    <div className="rounded-xl p-5 bg-white border border-neutral-200">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">{title}</p>
        {items.length > 0 && (
          <Link href={href} className="text-xs text-neutral-500 hover:text-neutral-900">
            See all →
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-neutral-400">{emptyHint}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.slice(0, 3).map(item => {
            const d = new Date(item.entry_date + 'T00:00:00')
            const dateLabel = d.toLocaleString('en-US', { month: 'short', day: 'numeric' })
            return (
              <li key={item.id} className="flex flex-col gap-0.5">
                <span className={`text-xs font-medium ${accentClass}`}>{dateLabel}</span>
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
      )}
    </div>
  )
}
