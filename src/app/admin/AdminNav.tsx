'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { ThemeToggle } from '@/components/ThemeToggle';

const navItems = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/admin/endpoints',
    label: 'Endpoints',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/admin/sections',
    label: 'Sections & Text',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: '/admin/settings',
    label: 'Settings',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function AdminNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (pathname === '/admin/login') return;

    let ignore = false;

    async function verifySession() {
      try {
        const res = await fetch('/api/admin/content', {
          cache: 'no-store',
          credentials: 'same-origin',
        });
        if (!ignore && !res.ok) {
          router.replace('/admin/login');
        }
      } catch {
        if (!ignore) {
          router.replace('/admin/login');
        }
      }
    }

    // Only verify session on back-navigation, not on initial mount
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        verifySession();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => {
      ignore = true;
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [pathname, router]);

  // Login page — no sidebar shell at all
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    setMobileOpen(false);
    router.push('/admin/login');
  }

  return (
    <div className="min-h-screen flex bg-[var(--color-surface)]">
      <aside
        className="hidden md:flex w-56 shrink-0 border-r border-[var(--color-border)] flex-col fixed top-0 left-0 h-full z-40"
        style={{ background: 'var(--color-card)' }}
      >
        <div className="px-4 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-brand)] flex items-center justify-center text-white text-[10px] font-bold">
              MS
            </div>
            <div>
              <div className="text-[12px] font-bold text-[var(--color-brand)] uppercase tracking-wider leading-none">
                Admin Panel
              </div>
              <div className="text-[10px] text-[var(--color-fg-muted)] mt-0.5">
                MediaScan Docs
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-[13.5px] transition-colors',
                  active
                    ? 'text-[var(--color-brand)] font-semibold'
                    : 'text-[var(--color-fg)] hover:bg-[var(--color-surface)]'
                )}
                style={active ? { background: 'var(--color-brand-subtle)' } : undefined}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-[var(--color-border)] space-y-1">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[12px] text-[var(--color-fg-muted)]">Theme</span>
            <ThemeToggle />
          </div>

          <a
            href="/docs/introduction"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Docs Site
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-error)] transition-colors text-left"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-56">
        <div className="md:hidden border-b border-[var(--color-border)] bg-[var(--color-card)] flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md border border-[var(--color-border)] p-2 text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-brand)] flex items-center justify-center text-white text-[10px] font-bold">
              MS
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-[var(--color-fg)] truncate">Admin Panel</div>
              <div className="text-[11px] text-[var(--color-fg-muted)] truncate">MediaScan Docs</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md border border-[var(--color-border)] px-3 py-2 text-[12px] text-[var(--color-fg-muted)] hover:text-[var(--color-error)]"
          >
            Sign Out
          </button>
        </div>

        {/* Backdrop */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
        )}

        <div className={clsx('fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-card)] transition-transform md:hidden', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
          <div className="px-4 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-brand)] flex items-center justify-center text-white text-[10px] font-bold">
                MS
              </div>
              <div>
                <div className="text-[12px] font-bold text-[var(--color-brand)] uppercase tracking-wider leading-none">
                  Admin Panel
                </div>
                <div className="text-[10px] text-[var(--color-fg-muted)] mt-0.5">
                  MediaScan Docs
                </div>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-md border border-[var(--color-border)] p-2 text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
              aria-label="Close menu"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="px-3 py-4 space-y-0.5">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    'flex items-center gap-2.5 px-3 py-2 rounded-md text-[13.5px] transition-colors',
                    active
                      ? 'text-[var(--color-brand)] font-semibold'
                      : 'text-[var(--color-fg)] hover:bg-[var(--color-surface)]'
                  )}
                  style={active ? { background: 'var(--color-brand-subtle)' } : undefined}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 py-3 border-t border-[var(--color-border)] space-y-1">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[12px] text-[var(--color-fg-muted)]">Theme</span>
              <ThemeToggle />
            </div>

            <a
              href="/docs/introduction"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Docs Site
            </a>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-error)] transition-colors text-left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        <main className="flex-1 min-h-screen overflow-x-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
