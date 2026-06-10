'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WEEK_ROW_PALETTE } from '@/lib/palette'

interface CalendarGridProps {
  entryDates: string[]
  starDates?: string[]
  routeBase: string
  viewYear?: number
  viewMonth?: number
  onMonthChange?: (year: number, month: number) => void
  hideNav?: boolean
}

const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

export default function CalendarGrid({
  entryDates,
  starDates,
  routeBase,
  viewYear: viewYearProp,
  viewMonth: viewMonthProp,
  onMonthChange,
  hideNav,
}: CalendarGridProps) {
  const router = useRouter()
  const today = new Date()
  const [internalYear, setInternalYear] = useState(today.getFullYear())
  const [internalMonth, setInternalMonth] = useState(today.getMonth())
  const viewYear = viewYearProp ?? internalYear
  const viewMonth = viewMonthProp ?? internalMonth

  const entrySet = new Set(entryDates)
  const starSet = new Set(starDates ?? [])
  const todayStr = ymd(today)

  const weeks = buildMonthGrid(viewYear, viewMonth)
  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('en-US', { month: 'long' })

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1)
    if (onMonthChange) {
      onMonthChange(next.getFullYear(), next.getMonth())
    } else {
      setInternalYear(next.getFullYear())
      setInternalMonth(next.getMonth())
    }
  }

  return (
    <div className="w-full max-w-3xl">
      {!hideNav && (
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => shiftMonth(-1)}
            className="w-9 h-9 rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 flex items-center justify-center"
            aria-label="Previous month"
          >
            <span className="text-neutral-600">‹</span>
          </button>
          <h2 className="text-lg font-semibold text-neutral-900">
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
      )}

      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium tracking-wider text-neutral-500">
            {d}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1 sm:gap-2">
        {weeks.map((week, rowIdx) => {
          const palette = WEEK_ROW_PALETTE[Math.min(rowIdx, WEEK_ROW_PALETTE.length - 1)]
          return (
            <div key={rowIdx} className="grid grid-cols-7 gap-1 sm:gap-2">
              {week.map((cell, colIdx) => {
                const dateStr = ymd(cell.date)
                const isToday = dateStr === todayStr
                const hasEntry = entrySet.has(dateStr)
                const hasStar = starSet.has(dateStr)
                const inMonth = cell.inMonth

                return (
                  <button
                    key={colIdx}
                    onClick={() => router.push(`${routeBase}/${dateStr}`)}
                    className="aspect-square rounded-lg flex flex-col items-center justify-center relative transition-opacity hover:opacity-80"
                    style={{
                      background: palette.bg,
                      border: `1px solid ${isToday ? palette.accent : palette.border}`,
                      borderWidth: isToday ? '2px' : '1px',
                      color: palette.text,
                      opacity: inMonth ? 1 : 0.35,
                    }}
                  >
                    <span className="text-sm sm:text-base font-medium">{cell.date.getDate()}</span>
                    {hasStar && (
                      <span
                        className="absolute text-amber-500"
                        style={{ top: '4px', right: '6px', fontSize: '11px', lineHeight: 1 }}
                        aria-label="Has highlight"
                      >
                        ★
                      </span>
                    )}
                    {hasEntry && (
                      <span
                        className="absolute"
                        style={{
                          bottom: '10px',
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: palette.accent,
                        }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface Cell {
  date: Date
  inMonth: boolean
}

function buildMonthGrid(year: number, month: number): Cell[][] {
  const first = new Date(year, month, 1)
  const startWeekday = first.getDay()
  const gridStart = new Date(year, month, 1 - startWeekday)

  const weeks: Cell[][] = []
  const cursor = new Date(gridStart)
  for (let w = 0; w < 6; w++) {
    const row: Cell[] = []
    for (let d = 0; d < 7; d++) {
      row.push({ date: new Date(cursor), inMonth: cursor.getMonth() === month })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(row)
  }
  return weeks
}

function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
