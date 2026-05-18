'use client'

import Link from 'next/link'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

export default function SignupForm() {
  return (
    <div className="flex flex-col gap-4">
      <GoogleSignInButton label="Sign up with Google" />
      <p className="text-center text-sm text-neutral-500">
        Already have an account?{' '}
        <Link href="/login" className="text-neutral-900 underline hover:no-underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
