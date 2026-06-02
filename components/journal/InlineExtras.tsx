'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { addExtra, deleteExtra, type ExtraItem, type ExtraKind } from '@/lib/extras'

interface InlineExtrasProps {
  kind: ExtraKind
  label: string
  addLabel: string
  userId: string
  date: string
  initial: ExtraItem[]
}

export default function InlineExtras({ kind, label, addLabel, userId, date, initial }: InlineExtrasProps) {
  const [items, setItems] = useState<ExtraItem[]>(initial)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!draft.trim() || saving) return
    setSaving(true)
    const supabase = createClient()
    const created = await addExtra(supabase, kind, userId, date, draft)
    if (created) setItems(prev => [created, ...prev])
    setDraft('')
    setAdding(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    setItems(prev => prev.filter(i => i.id !== id))
    await deleteExtra(supabase, kind, id)
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setDraft('')
      setAdding(false)
    }
  }

  const chipBg = kind === 'highlights' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-widest text-neutral-500">{label}</span>
        {items.map(item => (
          <span
            key={item.id}
            className={`inline-flex items-center gap-2 text-sm px-2.5 py-1 rounded-full border ${chipBg}`}
          >
            {item.text}
            <button
              onClick={() => handleDelete(item.id)}
              className="opacity-50 hover:opacity-100"
              aria-label="Delete"
              type="button"
            >
              ×
            </button>
          </span>
        ))}
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            type="button"
            className="text-sm px-2.5 py-1 rounded-full border border-dashed border-neutral-300 text-neutral-600 hover:border-neutral-400 hover:text-neutral-800"
          >
            + {addLabel}
          </button>
        )}
      </div>
      {adding && (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKey}
            placeholder={`Type a ${kind === 'highlights' ? 'highlight' : 'skill'} and press Enter`}
            className="flex-1 px-3 py-1.5 text-sm rounded-md bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-500"
          />
          <button
            onClick={handleSave}
            disabled={!draft.trim() || saving}
            type="button"
            className="text-sm px-3 py-1.5 rounded-md bg-neutral-900 text-white disabled:opacity-40"
          >
            Save
          </button>
          <button
            onClick={() => { setDraft(''); setAdding(false) }}
            type="button"
            className="text-sm px-3 py-1.5 rounded-md text-neutral-600 hover:text-neutral-900"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
