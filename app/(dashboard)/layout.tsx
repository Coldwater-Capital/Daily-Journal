import Navbar from '@/components/ui/Navbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#000000' }}>
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        {children}
      </main>
    </div>
  )
}
