'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import type { NavGroup } from '@/data/types';

interface Props {
  navGroups: NavGroup[];
}

export function SidebarClient({ navGroups }: Props) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-14 hidden lg:block w-64 shrink-0 self-start max-h-[calc(100vh-3.5rem)] overflow-y-auto sidebar-scroll py-8 pr-4">
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
                      className={clsx(
                        'block rounded-md px-3 py-1.5 text-[13.5px] transition-colors',
                        active
                          ? 'bg-[var(--color-brand)]/8 text-[var(--color-brand)] font-semibold'
                          : 'text-[var(--color-fg)] hover:bg-[var(--color-surface)] hover:text-[var(--color-fg)]'
                      )}
                      style={
                        active
                          ? { backgroundColor: 'rgba(24,119,242,0.08)' }
                          : undefined
                      }
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
    </aside>
  );
}
