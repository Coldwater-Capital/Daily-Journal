'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const inputStyle = {
  background: '#0A0A0A',
  border: '0.5px solid #91766E',
  borderRadius: '6px',
  color: '#F3ECE3',
  width: '100%',
  padding: '10px 12px',
  fontSize: '14px',
  outline: 'none',
}

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '500',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: '#C8A19C',
  opacity: 0.7,
  marginBottom: '6px',
}

const btnStyle = {
  width: '100%',
  padding: '10px',
  fontSize: '13px',
  fontWeight: '500',
  letterSpacing: '0.05em',
  color: '#F3ECE3',
  background: 'transparent',
  border: '0.5px solid #91766E',
  borderRadius: '6px',
  cursor: 'pointer',
}

export default function UpdatePasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label style={labelStyle}>New password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Confirm new password</label>
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={6} style={inputStyle} />
      </div>
      {error && <p className="text-sm" style={{ color: '#ffb4ab' }}>{error}</p>}
      <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.5 : 1 }}>
        {loading ? 'Updating...' : 'Update password'}
      </button>
    </form>
  )
}
