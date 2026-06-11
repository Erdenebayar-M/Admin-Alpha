'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { GraduationCap, Search } from 'lucide-react';
import { LogoutButton } from '@/components/LogoutButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/admin/overview', label: 'Нүүр' },
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

function UserAvatar() {
  return (
    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold select-none">
      А
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const handleAI = () => {
    router.push('/admin/tasks/generate');
    setMenuOpen(false);
  };

  const handleCreate = () => {
    router.push('/admin/tasks/create');
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Enterprise App Bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-card shadow-sm">
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6">

          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="size-4" />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground">Админ</span>
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-5 w-px bg-border" />

          {/* Tab-style navigation */}
          <nav className="hidden sm:flex items-end gap-0 h-14 -mb-px" aria-label="main navigation">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'relative flex items-center px-3 h-14 text-sm font-medium border-b-2 transition-colors duration-150',
                    active
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Search — visual placeholder */}
          <div className="hidden md:flex flex-1 max-w-xs ml-2">
            <div className="flex w-full items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:border-ring/50 transition-colors cursor-text">
              <Search className="size-3.5 shrink-0" />
              <span>Хайх…</span>
              <kbd className="ml-auto rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-medium leading-none">⌘K</kbd>
            </div>
          </div>

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleAI}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <StarIcon />
              AI-аар үүсгэх
            </button>

            <button
              type="button"
              onClick={handleCreate}
              className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <PlusIcon />
              Гараар үүсгэх
            </button>

            <div className="mx-1 h-5 w-px bg-border" />
            <ThemeToggle />

            {/* User avatar + logout popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLogout((v) => !v)}
                className="flex items-center rounded-full p-0.5 ring-offset-1 hover:ring-2 hover:ring-border transition-all"
                aria-label="Хэрэглэгчийн цэс"
              >
                <UserAvatar />
              </button>
              {showLogout && (
                <div className="absolute right-0 top-full mt-2 w-40 rounded-lg border border-border bg-card py-1 shadow-lg z-50">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-xs font-medium text-foreground">Админ</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Системийн эрх</p>
                  </div>
                  <div className="px-2 pt-1">
                    <LogoutButton />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile: icon-only + hamburger */}
          <div className="flex sm:hidden items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={handleAI}
              title="AI-аар үүсгэх"
              className="flex items-center justify-center rounded-md bg-primary p-1.5 text-primary-foreground transition-colors hover:bg-primary/90"
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
              aria-label={menuOpen ? 'Цэс хаах' : 'Цэс нээх'}
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
          <div className="sm:hidden border-t border-border bg-card px-4 py-3 flex flex-col gap-0.5">
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
                      ? 'bg-accent text-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {label}
                </Link>
              );
            })}
            <div className="mt-2 pt-2 border-t border-border">
              <LogoutButton />
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

    </div>
  );
}
