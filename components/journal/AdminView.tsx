'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import AdminCalendar from './AdminCalendar'

export interface AdminEntryRow {
  entry_id: string
  user_id: string
  user_email: string
  entry_date: string
  content: string | null
}

export interface AdminUserRow {
  user_id: string
  user_email: string
  entry_count: number
  highlight_count: number
  skill_count: number
  last_entry_date: string | null
}

interface AdminViewProps {
  entryDates: string[]
  allEntries: AdminEntryRow[]
  users: AdminUserRow[]
}

type Mode = 'calendar' | 'list'
type Grouping = 'day' | 'user'

export default function AdminView({ entryDates, allEntries, users }: AdminViewProps) {
  const today = new Date()
  const [mode, setMode] = useState<Mode>('calendar')
  const [grouping, setGrouping] = useState<Grouping>('day')
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('en-US', { month: 'long' })
  const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-`

  const monthDates = useMemo(() => {
    return Array.from(new Set(entryDates.filter(d => d.startsWith(prefix)))).sort()
  }, [entryDates, prefix])

  const entriesByDate = useMemo(() => {
    const map = new Map<string, AdminEntryRow[]>()
    for (const e of allEntries) {
      if (!map.has(e.entry_date)) map.set(e.entry_date, [])
      map.get(e.entry_date)!.push(e)
    }
    return map
  }, [allEntries])

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  const showMonthNav = mode === 'list' && grouping === 'day'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-neutral-900">Admin · All Users</h1>
        <div className="flex items-center gap-2">
          {mode === 'list' && (
            <select
              value={grouping}
              onChange={e => setGrouping(e.target.value as Grouping)}
              className="text-sm px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-neutral-700"
            >
              <option value="day">By entry day</option>
              <option value="user">By user</option>
            </select>
          )}
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
      </div>

      {showMonthNav && (
        <div className="flex items-center gap-2 self-start">
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
      )}

      {mode === 'calendar' && (
        <>
          <div className="flex justify-center">
            <AdminCalendar entryDates={entryDates} />
          </div>
          <p className="text-center text-sm text-neutral-500">
            Click any day to see every user&apos;s entry for that date
          </p>
        </>
      )}

      {mode === 'list' && grouping === 'day' && (
        <ByDayList dates={monthDates} entriesByDate={entriesByDate} />
      )}
      {mode === 'list' && grouping === 'user' && <ByUserList users={users} />}
    </div>
  )
}

function ByDayList({
  dates,
  entriesByDate,
}: {
  dates: string[]
  entriesByDate: Map<string, AdminEntryRow[]>
}) {
  if (dates.length === 0) {
    return <p className="text-sm text-neutral-500 text-center py-8">No entries this month.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {dates.map(date => {
        const d = new Date(date + 'T00:00:00')
        const dayName = d.toLocaleString('en-US', { weekday: 'short' })
        const dateLabel = d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        const count = entriesByDate.get(date)?.length ?? 0
        return (
          <Link
            key={date}
            href={`/admin/${date}`}
            className="flex items-baseline justify-between px-4 py-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors"
          >
            <span className="flex items-baseline gap-3">
              <span className="text-sm font-medium text-neutral-500 w-12 shrink-0">{dayName}</span>
              <span className="text-sm font-medium text-neutral-900">{dateLabel}</span>
            </span>
            <span className="text-xs text-neutral-500">
              {count} {count === 1 ? 'entry' : 'entries'}
            </span>
          </Link>
        )
      })}
    </ul>
  )
}

function ByUserList({ users }: { users: AdminUserRow[] }) {
  if (users.length === 0) {
    return <p className="text-sm text-neutral-500 text-center py-8">No users with entries yet.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {users.map(u => (
        <Link
          key={u.user_id}
          href={`/admin/user/${u.user_id}`}
          className="flex items-baseline justify-between px-4 py-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors"
        >
          <span className="text-sm font-medium text-neutral-900">{u.user_email}</span>
          <span className="text-xs text-neutral-500">
            {u.entry_count} entries · {u.highlight_count} highlights · {u.skill_count} skills
            {u.last_entry_date && ` · last ${u.last_entry_date}`}
          </span>
        </Link>
      ))}
    </ul>
  )
}
