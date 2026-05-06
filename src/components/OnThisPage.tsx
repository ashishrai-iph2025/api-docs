'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';

export interface TocItem {
  id: string;
  title: string;
  level?: 2 | 3;
}

export function OnThisPage({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? '');

  useEffect(() => {
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter(Boolean) as HTMLElement[];
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [items]);

  return (
    <aside className="sticky top-14 hidden xl:block w-56 shrink-0 self-start max-h-[calc(100vh-3.5rem)] overflow-y-auto sidebar-scroll py-8 pl-6">
      <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-fg-muted)]">
        On This Page
      </h4>
      <ul className="space-y-1.5 border-l border-[var(--color-border)]">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={clsx(
                '-ml-px block border-l-2 py-0.5 text-[13px] transition-colors',
                item.level === 3 ? 'pl-6' : 'pl-3',
                active === item.id
                  ? 'border-[var(--color-brand)] text-[var(--color-brand)] font-medium'
                  : 'border-transparent text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
              )}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
