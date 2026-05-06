import Link from 'next/link';
import { getEndpoints } from '@/lib/content-store';

export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  const endpoints = getEndpoints();

  const cards = [
    {
      title: 'API Endpoints',
      description: `Edit ${endpoints.length} endpoints — titles, paths, descriptions, parameters, and response examples.`,
      href: '/admin/endpoints',
      count: endpoints.length,
      color: 'var(--color-brand)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'Sections & Text',
      description: 'Edit Introduction, Login, Authorization, Support contacts, and navigation titles.',
      href: '/admin/sections',
      count: 5,
      color: '#7c3aed',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="py-6">
      <div className="mb-8">
        <h1 className="text-[24px] font-bold text-[var(--color-fg)]">Dashboard</h1>
        <p className="text-[14px] text-[var(--color-fg-muted)] mt-1">
          Manage all content displayed on the API documentation site.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-xl border border-[var(--color-border)] p-6 hover:border-[var(--color-brand)] hover:shadow-sm transition-all"
            style={{ background: 'var(--color-card)' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg"
                style={{ backgroundColor: `color-mix(in srgb, ${card.color} 12%, transparent)`, color: card.color }}
              >
                {card.icon}
              </div>
              <span
                className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `color-mix(in srgb, ${card.color} 10%, transparent)`, color: card.color }}
              >
                {card.count} items
              </span>
            </div>
            <h2 className="text-[16px] font-bold text-[var(--color-fg)] mb-1 group-hover:text-[var(--color-brand)] transition-colors">
              {card.title}
            </h2>
            <p className="text-[13px] text-[var(--color-fg-muted)] leading-relaxed">{card.description}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--color-border)] overflow-hidden" style={{ background: 'var(--color-card)' }}>
        <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[var(--color-fg)]">All Endpoints</h2>
          <Link href="/admin/endpoints" className="text-[13px] text-[var(--color-brand)] hover:underline font-medium">
            Edit all →
          </Link>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {endpoints.map((ep) => (
            <Link
              key={ep.id}
              href={`/admin/endpoints/${ep.id}`}
              className="flex items-center gap-4 px-6 py-3 hover:bg-[var(--color-surface)] transition-colors"
            >
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-[var(--color-brand)]/10 text-[var(--color-brand)] font-mono">
                {ep.method}
              </span>
              <code className="text-[13px] text-[var(--color-fg-muted)] font-mono flex-1">{ep.path}</code>
              <span className="text-[13px] text-[var(--color-fg)] font-medium">{ep.title}</span>
              <svg className="w-4 h-4 text-[var(--color-border-strong)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
