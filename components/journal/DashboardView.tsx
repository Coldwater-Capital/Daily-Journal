'use client'

import { useState, useMemo } from 'react'
import CalendarGrid from './CalendarGrid'
import EntryList, { type EntryRow } from './EntryList'

interface DashboardViewProps {
  entries: EntryRow[]
  starDates: string[]
  routeBase: string
}

type Mode = 'calendar' | 'list'

export default function DashboardView({ entries, starDates, routeBase }: DashboardViewProps) {
  const today = new Date()
  const [mode, setMode] = useState<Mode>('calendar')
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('en-US', { month: 'long' })

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  const entryDates = useMemo(() => entries.map(e => e.entry_date), [entries])

  const monthEntries = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-`
    return entries
      .filter(e => e.entry_date.startsWith(prefix))
      .sort((a, b) => a.entry_date.localeCompare(b.entry_date))
  }, [entries, viewYear, viewMonth])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftMonth(-1)}
            className="w-9 h-9 rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 flex items-center justify-center"
            aria-label="Previous month"
          >
            <span className="text-neutral-600">‹</span>
          </button>
          <h2 className="text-lg font-semibold text-neutral-900 min-w-[150px] text-center">
            {monthName}&nbsp;&nbsp;{viewYear}
          </h2>
          <button
            onClick={() => shiftMonth(1)}
            className="w-9 h-9 rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 flex items-center justify-center"
            aria-label="Next month"
          >
            <span className="text-neutral-600">›</span>
          </button>
        </div>

        <div className="inline-flex rounded-md border border-neutral-300 bg-white overflow-hidden">
          <button
            onClick={() => setMode('calendar')}
            className={`text-sm px-3 py-1.5 ${mode === 'calendar' ? 'bg-indigo-600 text-white' : 'text-neutral-700 hover:bg-neutral-50'}`}
          >
            Calendar
          </button>
          <button
            onClick={() => setMode('list')}
            className={`text-sm px-3 py-1.5 ${mode === 'list' ? 'bg-indigo-600 text-white' : 'text-neutral-700 hover:bg-neutral-50'}`}
          >
            List
          </button>
        </div>
      </div>

      {mode === 'calendar' ? (
        <CalendarGrid
          entryDates={entryDates}
          starDates={starDates}
          routeBase={routeBase}
          viewYear={viewYear}
          viewMonth={viewMonth}
          onMonthChange={(y, m) => { setViewYear(y); setViewMonth(m) }}
          hideNav
        />
      ) : (
        <EntryList entries={monthEntries} routeBase={routeBase} />
      )}
    </div>
  )
}
