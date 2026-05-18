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
    <nav className="bg-white border-b border-neutral-200">
      <div className="w-full max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-semibold text-neutral-900">Daily journal</span>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 text-sm text-neutral-700 border border-neutral-300 rounded-md bg-white hover:bg-neutral-50 transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
