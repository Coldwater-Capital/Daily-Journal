'use client'

import Link from 'next/link'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

export default function LoginForm() {
  return (
    <div className="flex flex-col gap-4">
      <GoogleSignInButton label="Sign in with Google" />
      <p className="text-center text-sm" style={{ color: '#C8A19C', opacity: 0.6 }}>
        No account?{' '}
        <Link href="/signup" style={{ color: '#C8A19C', opacity: 1 }} className="hover:opacity-80">
          Sign up
        </Link>
      </p>
    </div>
  )
}
