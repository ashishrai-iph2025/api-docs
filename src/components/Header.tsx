'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import clsx from 'clsx';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useMobileNav } from '@/lib/mobile-nav-context';
import { getCsrfToken } from '@/lib/csrf-client';

const navLinks = [
  { href: '/docs/introduction', label: 'Docs' },
  { href: '/docs/endpoints',    label: 'Endpoints' },
  { href: '/docs/json-dataset', label: 'Reference' },
  { href: '/docs/support',      label: 'Support' },
];

export function Header() {
  const pathname = usePathname();
  const router   = useRouter();
  const { setOpen } = useMobileNav();

  useEffect(() => {
    if (!pathname.startsWith('/docs')) return;

    let ignore = false;
    async function verifySession() {
      try {
        const res = await fetch('/api/session', {
          cache: 'no-store',
          credentials: 'same-origin',
        });
        if (!ignore && !res.ok) router.replace('/login');
      } catch {
        if (!ignore) router.replace('/login');
      }
    }

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) verifySession();
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => {
      ignore = true;
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [pathname, router]);

  if (pathname.startsWith('/admin') || pathname === '/login' || pathname === '/' || pathname === '/admin/login') {
    return null;
  }

  async function handleSignOut() {
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-CSRF-Token': getCsrfToken() },
    });
    document.cookie = 'csrf_token=; Max-Age=0; path=/; SameSite=Strict';
    router.replace('/');  // replace so back button doesn't return to protected page
  }

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-8xl flex-wrap items-center gap-3 px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand)] text-white font-bold text-[11px] tracking-tight">
            MS
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-[14px] tracking-tight text-[var(--color-fg)]">
              MediaScan
            </span>
            <span className="text-[10px] text-[var(--color-fg-muted)] font-medium tracking-wide">
              Developer Platform
            </span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1 text-[13.5px]">
          {navLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'px-3 py-1.5 rounded-md font-medium transition-colors',
                  active
                    ? 'text-[var(--color-brand)] bg-[var(--color-brand-subtle)]'
                    : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface)]'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors"
            aria-label="Open navigation"
          >
            <svg className="w-4 h-4 text-[var(--color-fg)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-fg-muted)]" />
            <input
              type="search"
              placeholder="Search docs..."
              className="w-52 max-w-[11rem] rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 pl-8 pr-3 text-[12.5px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 focus:border-[var(--color-brand)] transition"
            />
          </div>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Sign-out */}
          <button
            onClick={handleSignOut}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12.5px] font-medium text-[var(--color-fg-muted)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-error)] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
