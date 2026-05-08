'use client'

import Link from 'next/link'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

export default function SignupForm() {
  return (
    <div className="flex flex-col gap-4">
      <GoogleSignInButton label="Sign up with Google" />
      <p className="text-center text-sm" style={{ color: '#C8A19C', opacity: 0.6 }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: '#C8A19C', opacity: 1 }} className="hover:opacity-80">
          Sign in
        </Link>
      </p>
    </div>
  )
}
