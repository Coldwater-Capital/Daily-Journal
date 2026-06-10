'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import AdminCalendar from './AdminCalendar'
import VideoEmbed from './VideoEmbed'
import { WEEK_ROW_PALETTE, colorForUserId } from '@/lib/palette'

export interface AdminEntryRow {
  entry_id: string
  user_id: string
  user_email: string
  entry_date: string
  content: string | null
  video_url: string | null
  recorded_video_drive_id: string | null
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

  const monthDates = useMemo(
    () => Array.from(new Set(entryDates.filter(d => d.startsWith(prefix)))).sort(),
    [entryDates, prefix],
  )

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
        <ByDayAccordion dates={monthDates} entriesByDate={entriesByDate} />
      )}
      {mode === 'list' && grouping === 'user' && <ByUserList users={users} />}
    </div>
  )
}

function ByDayAccordion({
  dates,
  entriesByDate,
}: {
  dates: string[]
  entriesByDate: Map<string, AdminEntryRow[]>
}) {
  const [openDate, setOpenDate] = useState<string | null>(null)

  if (dates.length === 0) {
    return <p className="text-sm text-neutral-500 text-center py-8">No entries this month.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {dates.map((date, idx) => {
        const palette = WEEK_ROW_PALETTE[idx % WEEK_ROW_PALETTE.length]
        const d = new Date(date + 'T00:00:00')
        const dayName = d.toLocaleString('en-US', { weekday: 'short' })
        const dateLabel = d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        const dayEntries = entriesByDate.get(date) ?? []
        const isOpen = openDate === date

        return (
          <li
            key={date}
            className="rounded-lg overflow-hidden"
            style={{ background: palette.bg, border: `1px solid ${palette.border}` }}
          >
            <button
              onClick={() => setOpenDate(isOpen ? null : date)}
              className="w-full flex items-baseline justify-between px-4 py-3 hover:opacity-90 transition-opacity"
              style={{ color: palette.text }}
            >
              <span className="flex items-baseline gap-3">
                <span className="text-sm font-medium w-12 shrink-0 opacity-70">{dayName}</span>
                <span className="text-sm font-semibold">{dateLabel}</span>
              </span>
              <span className="flex items-center gap-3 text-xs">
                <span className="opacity-70">
                  {dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'}
                </span>
                <span className="text-base" style={{ color: palette.accent }}>
                  {isOpen ? '▾' : '▸'}
                </span>
              </span>
            </button>

            {isOpen && (
              <div className="bg-white border-t" style={{ borderColor: palette.border }}>
                {dayEntries.length === 0 ? (
                  <p className="text-sm text-neutral-500 px-4 py-3">No entries this day.</p>
                ) : (
                  <ul className="flex flex-col">
                    {dayEntries.map(entry => (
                      <EntryCard key={entry.entry_id} entry={entry} />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function EntryCard({ entry }: { entry: AdminEntryRow }) {
  const userColor = colorForUserId(entry.user_id)
  return (
    <li className="border-b last:border-b-0 border-neutral-100 px-4 py-4">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ background: userColor.accent }}
        />
        <span className="text-sm font-medium" style={{ color: userColor.text }}>
          {entry.user_email}
        </span>
      </div>

      {entry.content && (
        <p className="text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed mb-3">
          {entry.content}
        </p>
      )}

      {entry.video_url && <VideoEmbed url={entry.video_url} />}

      {entry.recorded_video_drive_id && (
        <div className="mt-3">
          <p className="text-xs uppercase tracking-widest mb-1 text-neutral-500">Recorded video</p>
          <video
            src={`/api/admin/video/${entry.entry_id}`}
            controls
            playsInline
            preload="metadata"
            className="w-full rounded-xl"
            style={{ aspectRatio: '16/9', background: '#000', border: '1px solid #D4D4D4' }}
          />
        </div>
      )}

      {!entry.content && !entry.video_url && !entry.recorded_video_drive_id && (
        <p className="text-sm italic text-neutral-400">Empty entry.</p>
      )}
    </li>
  )
}

function ByUserList({ users }: { users: AdminUserRow[] }) {
  if (users.length === 0) {
    return <p className="text-sm text-neutral-500 text-center py-8">No users with entries yet.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {users.map(u => {
        const c = colorForUserId(u.user_id)
        return (
          <Link
            key={u.user_id}
            href={`/admin/user/${u.user_id}`}
            className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 px-4 py-3 rounded-lg border transition-opacity hover:opacity-90"
            style={{ background: c.bg, borderColor: c.border, color: c.text }}
          >
            <span className="text-sm font-semibold break-all">{u.user_email}</span>
            <span className="text-xs opacity-80">
              {u.entry_count} entries · {u.highlight_count} highlights · {u.skill_count} skills
              {u.last_entry_date && ` · last ${u.last_entry_date}`}
            </span>
          </Link>
        )
      })}
    </ul>
  )
}
