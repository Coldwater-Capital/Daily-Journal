'use client'

import { useState, useRef, useEffect } from 'react'

type Status = 'idle' | 'requesting' | 'recording' | 'preview' | 'uploading' | 'deleting' | 'error'

interface VideoRecorderProps {
  date: string
  existingDriveId: string | null
  hasDriveConnected: boolean
  onVideoSaved: (driveId: string) => void
  onVideoDeleted: () => void
}

const ghostBtn: React.CSSProperties = {
  padding: '8px 14px',
  fontSize: '12px',
  fontWeight: '500',
  letterSpacing: '0.05em',
  color: '#F3ECE3',
  background: 'transparent',
  border: '0.5px solid #91766E',
  borderRadius: '6px',
  cursor: 'pointer',
}

const dimText: React.CSSProperties = {
  color: '#C8A19C',
  opacity: 0.5,
  fontSize: '13px',
}

export default function VideoRecorder({
  date,
  existingDriveId,
  hasDriveConnected,
  onVideoSaved,
  onVideoDeleted,
}: VideoRecorderProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const liveVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const mimeTypeRef = useRef<string>('video/webm')

  // Attach live camera stream after recording video element mounts
  useEffect(() => {
    if (status === 'recording' && liveVideoRef.current && streamRef.current) {
      liveVideoRef.current.srcObject = streamRef.current
      liveVideoRef.current.play().catch(() => {})
    }
  }, [status])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  if (!hasDriveConnected) {
    return (
      <p className="text-sm" style={{ color: '#C8A19C', opacity: 0.4 }}>
        Sign in with Google to record videos to your Drive.
      </p>
    )
  }

  async function getAccessToken(): Promise<string> {
    const res = await fetch('/api/drive-token')
    if (!res.ok) throw new Error('Could not get Drive access')
    const { accessToken } = await res.json()
    return accessToken
  }

  async function deleteDriveFile(driveId: string, token: string) {
    await fetch(`https://www.googleapis.com/drive/v3/files/${driveId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  async function startRecording() {
    setErrorMsg(null)
    setStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream

      // Pick the best supported MIME type across Chrome and Safari
      const candidates = ['video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4']
      const mimeType = candidates.find(t => MediaRecorder.isTypeSupported(t)) ?? ''
      mimeTypeRef.current = mimeType

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        setStatus('preview')
      }

      recorder.start(100)
      recorderRef.current = recorder
      setStatus('recording')
    } catch {
      setStatus('error')
      setErrorMsg('Camera access denied. Check your browser permissions and try again.')
    }
  }

  function stopRecording() {
    recorderRef.current?.stop()
  }

  async function handleSave() {
    if (!previewUrl) return
    setErrorMsg(null)
    setStatus('uploading')
    try {
      const token = await getAccessToken()

      if (existingDriveId) {
        await deleteDriveFile(existingDriveId, token)
      }

      const blob = await fetch(previewUrl).then(r => r.blob())
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm'
      const metadata = JSON.stringify({
        name: `Journal Entry ${date}.${ext}`,
        mimeType: blob.type,
      })
      const form = new FormData()
      form.append('metadata', new Blob([metadata], { type: 'application/json' }))
      form.append('file', blob)

      const uploadRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        }
      )
      if (!uploadRes.ok) {
        const errBody = await uploadRes.json().catch(() => ({}))
        const msg = errBody?.error?.message ?? errBody?.error ?? 'unknown'
        throw new Error(`Drive upload failed (${uploadRes.status}): ${msg}`)
      }
      const { id: driveId } = await uploadRes.json()

      await fetch('/api/save-drive-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driveId, date }),
      })

      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      onVideoSaved(driveId)
      setStatus('idle')
    } catch (err) {
      setErrorMsg((err instanceof Error ? err.message : 'Upload failed') + ' — your recording is still here.')
      setStatus('preview')
    }
  }

  function handleDiscard() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setStatus('idle')
  }

  async function handleDelete() {
    if (!existingDriveId) return
    setErrorMsg(null)
    setStatus('deleting')
    try {
      const token = await getAccessToken()
      await deleteDriveFile(existingDriveId, token)
      await fetch('/api/save-drive-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driveId: null, date }),
      })
      onVideoDeleted()
      setStatus('idle')
    } catch {
      setStatus('error')
      setErrorMsg('Could not delete video. Try again.')
    }
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm" style={{ color: '#ffb4ab' }}>{errorMsg}</p>
        <button onClick={() => setStatus('idle')} style={ghostBtn}>Try again</button>
      </div>
    )
  }

  if (status === 'uploading') return <p style={dimText}>Uploading to your Drive…</p>
  if (status === 'deleting') return <p style={dimText}>Deleting…</p>
  if (status === 'requesting') return <p style={dimText}>Requesting camera access…</p>

  if (status === 'recording') {
    return (
      <div className="flex flex-col gap-2">
        <video
          ref={liveVideoRef}
          muted
          playsInline
          className="w-full rounded-xl"
          style={{ aspectRatio: '16/9', background: '#000', border: '0.5px solid #91766E' }}
        />
        <button onClick={stopRecording} style={ghostBtn}>Stop recording</button>
      </div>
    )
  }

  if (status === 'preview' && previewUrl) {
    return (
      <div className="flex flex-col gap-2">
        {/* key forces a fresh element whenever the URL changes */}
        <video
          key={previewUrl}
          src={previewUrl}
          controls
          playsInline
          autoPlay
          className="w-full rounded-xl"
          style={{ aspectRatio: '16/9', background: '#000', border: '0.5px solid #91766E' }}
        />
        {errorMsg && (
          <p className="text-sm" style={{ color: '#ffb4ab' }}>{errorMsg}</p>
        )}
        <div className="flex gap-2">
          <button onClick={handleSave} style={ghostBtn}>Save to my Drive</button>
          <button onClick={handleDiscard} style={{ ...ghostBtn, opacity: 0.5 }}>Discard</button>
        </div>
      </div>
    )
  }

  if (existingDriveId) {
    return (
      <div className="flex flex-col gap-2">
        <iframe
          src={`https://drive.google.com/file/d/${existingDriveId}/preview`}
          className="w-full rounded-xl"
          style={{ aspectRatio: '16/9', border: '0.5px solid #91766E' }}
          allow="autoplay"
        />
        <div className="flex gap-2">
          <button onClick={startRecording} style={ghostBtn}>Re-record</button>
          <button onClick={handleDelete} style={{ ...ghostBtn, opacity: 0.5 }}>Delete video</button>
        </div>
      </div>
    )
  }

  return <button onClick={startRecording} style={ghostBtn}>Record a video</button>
}
