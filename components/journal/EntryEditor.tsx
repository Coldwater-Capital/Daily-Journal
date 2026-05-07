'use client'

import { useState, useRef, useEffect } from 'react'

import dynamic from 'next/dynamic'
import { useDebouncedCallback } from 'use-debounce'
import { createClient } from '@/lib/supabase/client'
import SaveIndicator from '@/components/ui/SaveIndicator'
import VideoEmbed from '@/components/journal/VideoEmbed'

const VoiceRecorder = dynamic(() => import('@/components/journal/VoiceRecorder'), { ssr: false })

interface EntryEditorProps {
  initialContent: string | null
  initialVideoUrl: string | null
  userId: string
  date: string
}

export default function EntryEditor({ initialContent, initialVideoUrl, userId, date }: EntryEditorProps) {
  const [content, setContent] = useState(initialContent ?? '')
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl ?? '')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const isFirstRender = useRef(true)
  const hadContent = useRef(!!(initialContent || initialVideoUrl))

  const save = useDebouncedCallback(async (currentContent: string, currentVideoUrl: string) => {
    setSaveStatus('saving')
    const supabase = createClient()
    await supabase.from('journal_entries').upsert({
      user_id: userId,
      entry_date: date,
      content: currentContent || null,
      video_url: currentVideoUrl || null,
    }, { onConflict: 'user_id,entry_date' })
    hadContent.current = true
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }, 1000)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (!content && !videoUrl) {
      save.cancel()
      return
    }
    hadContent.current = true
    save(content, videoUrl)
  }, [content, videoUrl])

  async function handleBack() {
    const supabase = createClient()
    save.cancel()
    if (!content && !videoUrl) {
      if (hadContent.current) {
        await supabase.from('journal_entries')
          .delete()
          .eq('user_id', userId)
          .eq('entry_date', date)
      }
    } else {
      await supabase.from('journal_entries').upsert({
        user_id: userId,
        entry_date: date,
        content: content || null,
        video_url: videoUrl || null,
      }, { onConflict: 'user_id,entry_date' })
    }
    window.location.href = '/dashboard'
  }

  function handleTranscript(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    setContent(prev => {
      const prevTrimmed = prev.trimEnd()
      const lastChar = prevTrimmed.slice(-1)
      const needsCapital = lastChar === '.' || lastChar === '!' || lastChar === '?'
      const word = needsCapital ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : trimmed
      const separator = prevTrimmed.length === 0 ? '' : lastChar === '\n' ? '' : ' '
      return prevTrimmed + separator + word
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={handleBack}
        className="text-sm inline-block mb-0 hover:opacity-80 transition-opacity self-start"
        style={{ color: '#C8A19C', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        ← Back to calendar
      </button>

      <div className="flex items-center justify-between">
        <VoiceRecorder onTranscript={handleTranscript} />
        <SaveIndicator status={saveStatus} />
      </div>

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Write your journal entry..."
        className="w-full min-h-[400px] p-4 text-base leading-relaxed resize-y focus:outline-none"
        style={{
          background: '#111111',
          border: '0.5px solid #91766E',
          borderRadius: '10px',
          color: '#F3ECE3',
        }}
      />

      <div>
        <label className="block text-xs font-medium uppercase tracking-widest mb-2" style={{ color: '#C8A19C', opacity: 0.5 }}>
          Video link (YouTube, Vimeo, or Loom)
        </label>
        <input
          type="url"
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full px-3 py-2 text-sm focus:outline-none"
          style={{
            background: '#111111',
            border: '0.5px solid #91766E',
            borderRadius: '8px',
            color: '#F3ECE3',
          }}
        />
        <VideoEmbed url={videoUrl} />
      </div>
    </div>
  )
}
