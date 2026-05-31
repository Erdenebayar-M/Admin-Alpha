'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogoutButton } from '@/components/LogoutButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GenerateModal } from '@/components/modals/GenerateModal';
import { useModalStore } from '@/lib/modal-store';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/admin/review', label: 'Хяналт' },
  { href: '/admin/tasks', label: 'Даалгаврууд' },
];

const StarIcon = () => (
  <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { setOpenGenerate } = useModalStore();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleAI = () => {
    setOpenGenerate(true);
    setMenuOpen(false);
  };

  const handleCreate = () => {
    router.push('/admin/tasks/create');
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-12 items-center justify-between px-4 sm:px-6">

          {/* Brand + desktop nav */}
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="text-sm font-bold tracking-tight text-foreground">Админ</span>
            <nav className="hidden sm:flex gap-1">
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

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={handleAI}
              className="flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-80"
            >
              <StarIcon />
              AI-аар үүсгэх
            </button>

            <button
              type="button"
              onClick={handleCreate}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <PlusIcon />
              Гараар үүсгэх
            </button>

            <div className="mx-1 h-5 w-px bg-border" />
            <ThemeToggle />
            <LogoutButton />
          </div>

          {/* Mobile: icon-only actions + hamburger */}
          <div className="flex sm:hidden items-center gap-1">
            <button
              type="button"
              onClick={handleAI}
              title="AI-аар үүсгэх"
              className="flex items-center justify-center rounded-md bg-foreground p-1.5 text-background transition-opacity hover:opacity-80"
            >
              <StarIcon />
            </button>
            <button
              type="button"
              onClick={handleCreate}
              title="Гараар үүсгэх"
              className="flex items-center justify-center rounded-md border border-border p-1.5 text-foreground transition-colors hover:bg-muted"
            >
              <PlusIcon />
            </button>
            <ThemeToggle />
            <button
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center justify-center rounded-md p-1.5 text-foreground transition-colors hover:bg-muted"
            >
              {menuOpen ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {menuOpen && (
          <div className="sm:hidden border-t border-border bg-background px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {label}
                </Link>
              );
            })}
            <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Тохиргоо</span>
              <LogoutButton />
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      <GenerateModal />
    </div>
  );
}
