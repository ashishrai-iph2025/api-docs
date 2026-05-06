import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="mb-2 flex items-center gap-1.5 text-[13px] text-[var(--color-fg-muted)]">
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-1.5">
          {idx > 0 && <ChevronRight className="h-3.5 w-3.5" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-[var(--color-brand)] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--color-fg)]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
