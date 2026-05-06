'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import clsx from 'clsx';
import { ThemeToggle } from '@/components/ThemeToggle';

const navLinks = [
  { href: '/docs/introduction', label: 'Docs' },
  { href: '/docs/endpoints',    label: 'Endpoints' },
  { href: '/docs/json-dataset', label: 'Reference' },
  { href: '/docs/support',      label: 'Support' },
];

export function Header() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return null;
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

          {/* Admin button */}
          <Link
            href="/admin/login"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12.5px] font-medium text-[var(--color-fg-muted)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}
