import { LogoutButton } from '@/components/LogoutButton'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-zinc-200 bg-white px-6 py-3 flex items-center justify-between shrink-0">
        <span className="text-sm font-medium text-zinc-700">Admin Panel</span>
        <LogoutButton />
      </header>
      {children}
    </div>
  )
}
