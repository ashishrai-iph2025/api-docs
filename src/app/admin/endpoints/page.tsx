import Link from 'next/link';
import { getContentData, getEndpoints } from '@/lib/content-store';
import { NewEndpointForm } from './NewEndpointForm';

export const dynamic = 'force-dynamic';

export default function AdminEndpointsPage() {
  const endpoints = getEndpoints();
  const contentData = getContentData();

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/dashboard" className="text-[13px] text-[var(--color-fg-muted)] hover:text-[var(--color-brand)]">
          ← Dashboard
        </Link>
        <span className="text-[var(--color-border-strong)]">/</span>
        <span className="text-[13px] text-[var(--color-fg)] font-medium">Endpoints</span>
      </div>

      <div className="mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-[var(--color-fg)]">API Endpoints</h1>
          <p className="text-[14px] text-[var(--color-fg-muted)] mt-1">
            Click an endpoint to edit its title, description, path, parameters, and response examples.
          </p>
        </div>
      </div>

      <NewEndpointForm allContent={contentData} existingIds={endpoints.map((ep) => ep.id)} />

      <div className="rounded-xl border border-[var(--color-border)] overflow-hidden" style={{ background: 'var(--color-card)' }}>
        <div className="divide-y divide-[var(--color-border)]">
          {endpoints.map((ep, i) => (
            <Link
              key={ep.id}
              href={`/admin/endpoints/${ep.id}`}
              className="flex items-center gap-4 px-6 py-4 hover:bg-[var(--color-surface)] transition-colors group"
            >
              <span className="text-[12px] text-[var(--color-fg-muted)] w-6 shrink-0">{i + 1}</span>
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-[var(--color-brand)]/10 text-[var(--color-brand)] font-mono shrink-0">
                {ep.method}
              </span>
              <code className="text-[13px] text-[var(--color-fg-muted)] font-mono flex-1 min-w-0 truncate">
                {ep.path}
              </code>
              <span className="text-[14px] font-semibold text-[var(--color-fg)] shrink-0">{ep.title}</span>
              <span className="text-[12px] text-[var(--color-fg-muted)] truncate max-w-xs hidden xl:block">
                {ep.description}
              </span>
              <div className="ml-auto flex items-center gap-2 shrink-0">
                <span className="text-[12px] text-[var(--color-brand)] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Edit
                </span>
                <svg className="w-4 h-4 text-[var(--color-border-strong)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
