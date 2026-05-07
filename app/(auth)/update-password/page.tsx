import UpdatePasswordForm from '@/components/auth/UpdatePasswordForm'

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#000000' }}>
      <div className="p-8 w-full max-w-sm" style={{ background: '#111111', border: '0.5px solid #91766E', borderRadius: '12px' }}>
        <h1 className="text-2xl font-bold mb-6 text-center" style={{ color: '#F3ECE3' }}>Set new password</h1>
        <UpdatePasswordForm />
      </div>
    </div>
  )
}
