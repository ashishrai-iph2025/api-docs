'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import clsx from 'clsx';
import type { NavGroup } from '@/data/types';
import { useMobileNav } from '@/lib/mobile-nav-context';

const navLinks = [
  { href: '/docs/introduction', label: 'Docs' },
  { href: '/docs/endpoints',    label: 'Endpoints' },
  { href: '/docs/json-dataset', label: 'Reference' },
  { href: '/docs/support',      label: 'Support' },
];

interface Props {
  navGroups: NavGroup[];
}

function NavTree({ navGroups, pathname, onLinkClick }: { navGroups: NavGroup[]; pathname: string; onLinkClick?: () => void }) {
  return (
    <nav className="space-y-7">
      {navGroups.map((group) => (
        <div key={group.title}>
          <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-fg-muted)]">
            {group.title}
          </h3>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const href = `/docs/${item.id}`;
              const active = pathname === href;
              return (
                <li key={item.id}>
                  <Link
                    href={href}
                    onClick={onLinkClick}
                    className={clsx(
                      'block rounded-md px-3 py-1.5 text-[13.5px] transition-colors',
                      active
                        ? 'font-semibold text-[var(--color-brand)]'
                        : 'text-[var(--color-fg)] hover:bg-[var(--color-surface)]'
                    )}
                    style={active ? { backgroundColor: 'rgba(var(--color-brand-rgb,24,119,242),0.08)' } : undefined}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function SidebarClient({ navGroups }: Props) {
  const pathname = usePathname();
  const { open, setOpen } = useMobileNav();

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname, setOpen]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="sticky top-14 hidden lg:block w-64 shrink-0 self-start max-h-[calc(100vh-3.5rem)] overflow-y-auto sidebar-scroll py-8 pr-4">
        <NavTree navGroups={navGroups} pathname={pathname} />
      </aside>

      {/* ── Mobile drawer backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer panel ── */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-72 flex flex-col lg:hidden transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ background: 'var(--color-card)', borderRight: '1px solid var(--color-border)' }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg text-white text-[10px] font-bold"
              style={{ background: 'var(--color-brand)' }}>
              MS
            </div>
            <span className="text-[13px] font-bold" style={{ color: 'var(--color-fg)' }}>MediaScan Docs</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-[var(--color-surface)] transition-colors"
            aria-label="Close navigation"
          >
            <svg className="w-4 h-4" style={{ color: 'var(--color-fg-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Top nav links */}
        <div className="flex flex-col gap-0.5 px-3 py-3 border-b border-[var(--color-border)]">
          {navLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  'px-3 py-2 rounded-md text-[13.5px] font-medium transition-colors',
                  active
                    ? 'font-semibold text-[var(--color-brand)]'
                    : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface)]'
                )}
                style={active ? { backgroundColor: 'rgba(24,119,242,0.08)' } : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Full nav tree */}
        <div className="flex-1 overflow-y-auto sidebar-scroll px-3 py-6">
          <NavTree navGroups={navGroups} pathname={pathname} onLinkClick={() => setOpen(false)} />
        </div>
      </div>
    </>
  );
}
