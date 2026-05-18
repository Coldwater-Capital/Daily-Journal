import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="p-8 w-full max-w-sm rounded-xl bg-white border border-neutral-200 shadow-sm">
        <h1 className="text-2xl font-bold mb-6 text-center text-neutral-900">Welcome back</h1>
        <LoginForm />
      </div>
    </div>
  )
}
