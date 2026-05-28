'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogoutButton } from '@/components/LogoutButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GenerateModal } from '@/components/modals/GenerateModal';
import { useModalStore } from '@/lib/modal-store';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/admin/review', label: 'Хяналт' },
  { href: '/admin/tasks', label: 'Даалгаврууд' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { setOpenGenerate } = useModalStore();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-12 items-center justify-between px-6">
          {/* Brand + nav */}
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold tracking-tight text-foreground">Админ</span>
            <nav className="flex gap-1">
              {NAV_LINKS.map(({ href, label }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      active
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Action buttons + utils */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpenGenerate(true)}
              className="flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-80"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              AI-аар үүсгэх
            </button>

            <button
              type="button"
              onClick={() => router.push('/admin/tasks/create')}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Гараар үүсгэх
            </button>

            <div className="mx-1 h-5 w-px bg-border" />
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <GenerateModal />
    </div>
  );
}
