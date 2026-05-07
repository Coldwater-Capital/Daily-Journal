'use client'

import { useRouter } from 'next/navigation'

export default function BackButton() {
  const router = useRouter()

  function handleClick() {
    router.push('/dashboard')
    setTimeout(() => router.refresh(), 500)
  }

  return (
    <button
      onClick={handleClick}
      className="text-sm inline-block mb-4 hover:opacity-80 transition-opacity"
      style={{ color: '#C8A19C', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      ← Back to calendar
    </button>
  )
}
