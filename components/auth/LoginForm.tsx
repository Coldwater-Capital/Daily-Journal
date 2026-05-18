'use client'

import Link from 'next/link'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

export default function LoginForm() {
  return (
    <div className="flex flex-col gap-4">
      <GoogleSignInButton label="Sign in with Google" />
      <p className="text-center text-sm text-neutral-500">
        No account?{' '}
        <Link href="/signup" className="text-neutral-900 underline hover:no-underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
