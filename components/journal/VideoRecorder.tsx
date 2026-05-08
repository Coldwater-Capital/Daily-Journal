'use client'

import { useState, useRef, useEffect } from 'react'

type Status = 'idle' | 'requesting' | 'recording' | 'preview' | 'saving' | 'deleting' | 'error'

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

function uploadWithProgress(
  url: string,
  body: FormData,
  token: string,
  onProgress: (pct: number) => void,
): Promise<{ id: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText))
      } else {
        reject(new Error(`Drive upload failed (${xhr.status})`))
      }
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(body)
  })
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
  const [uploadPct, setUploadPct] = useState(0)
  const liveVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  // Holds the in-progress background upload promise
  const uploadPromiseRef = useRef<Promise<{ id: string }> | null>(null)

  useEffect(() => {
    if (status === 'recording' && liveVideoRef.current && streamRef.current) {
      liveVideoRef.current.srcObject = streamRef.current
      liveVideoRef.current.play().catch(() => {})
    }
  }, [status])

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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } },
        audio: true,
      })
      streamRef.current = stream

      const candidates = ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4']
      const mimeType = candidates.find(t => MediaRecorder.isTypeSupported(t)) ?? ''

      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        videoBitsPerSecond: 800_000, // 800 Kbps — ~6 MB/min, good enough for journaling
      })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        setPreviewUrl(URL.createObjectURL(blob))
        setUploadPct(0)

        // Start uploading in the background while the user reviews the preview
        uploadPromiseRef.current = (async () => {
          const token = await getAccessToken()
          const ext = blob.type.includes('mp4') ? 'mp4' : 'webm'
          const metadata = JSON.stringify({
            name: `Journal Entry ${date}.${ext}`,
            mimeType: blob.type,
          })
          const form = new FormData()
          form.append('metadata', new Blob([metadata], { type: 'application/json' }))
          form.append('file', blob)
          return uploadWithProgress(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            form,
            token,
            setUploadPct,
          )
        })()

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
    if (!uploadPromiseRef.current) return
    setErrorMsg(null)
    setStatus('saving')
    try {
      // Await the background upload — may already be complete
      const { id: newDriveId } = await uploadPromiseRef.current
      uploadPromiseRef.current = null

      // Delete the old Drive file only after the new one is confirmed uploaded
      if (existingDriveId) {
        const token = await getAccessToken()
        await deleteDriveFile(existingDriveId, token)
      }

      await fetch('/api/save-drive-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driveId: newDriveId, date }),
      })

      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      onVideoSaved(newDriveId)
      setStatus('idle')
    } catch (err) {
      setErrorMsg((err instanceof Error ? err.message : 'Upload failed') + ' — your recording is still here.')
      setStatus('preview')
    }
  }

  function handleDiscard() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    // Best-effort cleanup: delete the background-uploaded file if it completed
    uploadPromiseRef.current
      ?.then(async ({ id }) => {
        try {
          const token = await getAccessToken()
          await deleteDriveFile(id, token)
        } catch {}
      })
      .catch(() => {})
    uploadPromiseRef.current = null
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

  if (status === 'saving') return <p style={dimText}>Saving…</p>
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
          style={{ aspectRatio: '16/9', background: '#000', border: '0.5px solid #91766E', transform: 'scaleX(-1)' }}
        />
        <button onClick={stopRecording} style={ghostBtn}>Stop recording</button>
      </div>
    )
  }

  if (status === 'preview' && previewUrl) {
    return (
      <div className="flex flex-col gap-2">
        <video
          key={previewUrl}
          src={previewUrl}
          controls
          playsInline
          autoPlay
          className="w-full rounded-xl"
          style={{ aspectRatio: '16/9', background: '#000', border: '0.5px solid #91766E' }}
        />
        {/* Upload progress — visible while upload is running in the background */}
        {uploadPct < 100 && (
          <div className="flex flex-col gap-1">
            <div style={{ background: '#1A1410', borderRadius: '4px', overflow: 'hidden', height: '3px' }}>
              <div style={{ background: '#C8A19C', width: `${uploadPct}%`, height: '100%', transition: 'width 0.2s ease' }} />
            </div>
            <p style={{ ...dimText, fontSize: '11px' }}>Uploading in background… {uploadPct}%</p>
          </div>
        )}
        {errorMsg && <p className="text-sm" style={{ color: '#ffb4ab' }}>{errorMsg}</p>}
        <div className="flex gap-2">
          <button onClick={handleSave} style={ghostBtn}>
            {uploadPct < 100 ? `Save to my Drive (${uploadPct}%)` : 'Save to my Drive'}
          </button>
          <button onClick={handleDiscard} style={{ ...ghostBtn, opacity: 0.5 }}>Discard</button>
        </div>
      </div>
    )
  }

  if (existingDriveId) {
    return (
      <div className="flex flex-col gap-2">
        <video
          key={existingDriveId}
          src={`/api/drive-stream/${existingDriveId}`}
          controls
          playsInline
          className="w-full rounded-xl"
          style={{ aspectRatio: '16/9', background: '#000', border: '0.5px solid #91766E' }}
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
