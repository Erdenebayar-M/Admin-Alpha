import Link from 'next/link'
import { LogoutButton } from '@/components/LogoutButton'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-background px-6 py-3 flex items-center justify-between shrink-0">
        <nav className="flex items-center gap-4">
          <span className="text-sm font-semibold text-foreground">Admin Panel</span>
          <Link
            href="/admin/review"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Review Queue
          </Link>
          <Link
            href="/admin/tasks/create"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Create Task
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>
      {children}
    </div>
  )
}
