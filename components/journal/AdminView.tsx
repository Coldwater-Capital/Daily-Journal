'use client'

import { useState } from 'react'
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
  const [mode, setMode] = useState<Mode>('calendar')
  const [grouping, setGrouping] = useState<Grouping>('day')

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

      {mode === 'list' && grouping === 'day' && <ByDayList entries={allEntries} />}
      {mode === 'list' && grouping === 'user' && <ByUserList users={users} />}
    </div>
  )
}

function ByDayList({ entries }: { entries: AdminEntryRow[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-neutral-500 text-center py-8">No entries from any user yet.</p>
  }

  const groups = new Map<string, AdminEntryRow[]>()
  for (const e of entries) {
    if (!groups.has(e.entry_date)) groups.set(e.entry_date, [])
    groups.get(e.entry_date)!.push(e)
  }

  const sortedDates = Array.from(groups.keys()).sort((a, b) => b.localeCompare(a))

  return (
    <div className="flex flex-col gap-6">
      {sortedDates.map(date => {
        const d = new Date(date + 'T00:00:00')
        const label = d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
        return (
          <section key={date}>
            <Link
              href={`/admin/${date}`}
              className="text-sm font-semibold text-neutral-900 hover:underline"
            >
              {label}
            </Link>
            <ul className="mt-2 flex flex-col gap-1.5">
              {groups.get(date)!.map(entry => {
                const snippet = (entry.content ?? '').replace(/\s+/g, ' ').trim().slice(0, 80)
                return (
                  <li key={entry.entry_id} className="flex items-baseline gap-3">
                    <span className="text-xs text-neutral-500 w-44 shrink-0 truncate">{entry.user_email}</span>
                    <span className="text-sm text-neutral-600 truncate">
                      {snippet || <span className="italic text-neutral-400">no text</span>}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
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
