'use client'

import { useState } from 'react'
import Link from 'next/link'
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

export default function ResetPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/update-password',
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center flex flex-col gap-3">
        <p className="font-medium" style={{ color: '#C8A19C' }}>Check your email</p>
        <p className="text-sm" style={{ color: '#F3ECE3', opacity: 0.6 }}>
          We sent a reset link to <strong style={{ color: '#F3ECE3' }}>{email}</strong>
        </p>
        <Link href="/login" className="text-sm hover:opacity-80" style={{ color: '#C8A19C' }}>Back to sign in</Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: '#F3ECE3', opacity: 0.5 }}>Enter your email and we&apos;ll send you a reset link.</p>
      <div>
        <label style={labelStyle}>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
      </div>
      {error && <p className="text-sm" style={{ color: '#ffb4ab' }}>{error}</p>}
      <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.5 : 1 }}>
        {loading ? 'Sending...' : 'Send reset link'}
      </button>
      <Link href="/login" className="text-center text-sm hover:opacity-80" style={{ color: '#C8A19C', opacity: 0.6 }}>Back to sign in</Link>
    </form>
  )
}
