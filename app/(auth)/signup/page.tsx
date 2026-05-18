import SignupForm from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="p-8 w-full max-w-sm rounded-xl bg-white border border-neutral-200 shadow-sm">
        <h1 className="text-2xl font-bold mb-6 text-center text-neutral-900">Create account</h1>
        <SignupForm />
      </div>
    </div>
  )
}
