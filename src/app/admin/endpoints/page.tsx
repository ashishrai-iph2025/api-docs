import Link from 'next/link';
import { getContentData, getEndpoints } from '@/lib/content-store';
import { NewEndpointForm } from './NewEndpointForm';
import { EndpointsList } from './EndpointsList';

export const dynamic = 'force-dynamic';

export default function AdminEndpointsPage() {
  const endpoints = getEndpoints();
  const contentData = getContentData();

  return (
    <div className="py-6">
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
            Click an endpoint to edit it. Drag rows or use the arrows to reorder.
          </p>
        </div>
      </div>

      <NewEndpointForm allContent={contentData} existingIds={endpoints.map((ep) => ep.id)} />

      <EndpointsList initialEndpoints={endpoints} />
    </div>
  );
}
