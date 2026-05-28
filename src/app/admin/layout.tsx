'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from '@/components/LogoutButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/admin/review',       label: 'Review Queue' },
  { href: '/admin/tasks',        label: 'Tasks' },
  { href: '/admin/generate',     label: 'Generate' },
  { href: '/admin/tasks/create', label: 'Create Task' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-12 items-center justify-between px-6">
          {/* Brand + nav */}
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold tracking-tight text-foreground">
              Admin
            </span>

            <nav className="flex items-center gap-1">
              {NAV_LINKS.map(({ href, label }) => {
                const active =
                  href === '/admin/tasks'
                    ? pathname === '/admin/tasks'
                    : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
