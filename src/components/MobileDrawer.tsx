'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import clsx from 'clsx';
import { useMobileNav } from '@/lib/mobile-nav-context';

const navLinks = [
  { href: '/docs/introduction', label: 'Docs' },
  { href: '/docs/endpoints',    label: 'Endpoints' },
  { href: '/docs/json-dataset', label: 'Reference' },
  { href: '/docs/support',      label: 'Support' },
];

export function MobileDrawer() {
  const pathname = usePathname();
  const { open, setOpen, navGroups } = useMobileNav();

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname, setOpen]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) {
    return (
      // Keep in DOM for transition — but we'll just skip rendering when not open
      // to avoid unnecessary DOM nodes. The backdrop + panel unmount cleanly.
      null
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        onClick={() => setOpen(false)}
      />

      {/* Drawer panel */}
      <div
        className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col lg:hidden"
        style={{ background: 'var(--color-card)', borderRight: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg text-white text-[10px] font-bold"
              style={{ background: 'var(--color-brand)' }}>
              MS
            </div>
            <span className="text-[13px] font-bold" style={{ color: 'var(--color-fg)' }}>MediaScan Docs</span>
          </div>
          <button onClick={() => setOpen(false)}
            className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-[var(--color-surface)] transition-colors"
            aria-label="Close navigation">
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
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                className={clsx(
                  'px-3 py-2 rounded-md text-[13.5px] font-medium transition-colors',
                  active ? 'font-semibold' : 'hover:bg-[var(--color-surface)]'
                )}
                style={active
                  ? { background: 'rgba(24,119,242,0.08)', color: 'var(--color-brand)' }
                  : { color: 'var(--color-fg-muted)' }}>
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Sidebar nav tree — only shown on docs pages */}
        {navGroups.length > 0 && (
          <div className="flex-1 overflow-y-auto sidebar-scroll px-3 py-5">
            <nav className="space-y-7">
              {navGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--color-fg-muted)' }}>
                    {group.title}
                  </h3>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const href = `/docs/${item.id}`;
                      const active = pathname === href;
                      return (
                        <li key={item.id}>
                          <Link href={href} onClick={() => setOpen(false)}
                            className={clsx(
                              'block rounded-md px-3 py-1.5 text-[13.5px] transition-colors',
                              active ? 'font-semibold' : 'hover:bg-[var(--color-surface)]'
                            )}
                            style={active
                              ? { background: 'rgba(24,119,242,0.08)', color: 'var(--color-brand)' }
                              : { color: 'var(--color-fg)' }}>
                            {item.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        )}
      </div>
    </>
  );
}
