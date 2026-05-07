'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav style={{ background: '#0A0A0A', borderBottom: '0.5px solid #91766E' }}>
      <div className="w-full px-6 py-4 flex items-center justify-between">
        <span style={{ color: '#F3ECE3' }} className="text-base font-semibold">Daily Journal</span>
        <button
          onClick={handleLogout}
          style={{ color: '#C8A19C' }}
          className="text-sm hover:opacity-80 transition-opacity"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
