'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Endpoint, HttpMethod } from '@/data/types';
import { apiFetch } from '@/lib/csrf-client';
import type { ContentData } from '@/lib/content-store';

interface Props {
  allContent: ContentData;
  existingIds: string[];
}

const inputCls = 'w-full px-3 py-2 text-[14px] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 focus:border-[var(--color-brand)] transition';
const inputStyle = { background: 'var(--color-input-bg)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' };

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function uniqueSlug(base: string, ids: Set<string>) {
  const fallback = base || 'new-endpoint';
  let slug = fallback;
  let index = 2;
  while (ids.has(slug)) {
    slug = `${fallback}-${index}`;
    index += 1;
  }
  return slug;
}

export function NewEndpointForm({ allContent, existingIds }: Props) {
  const router = useRouter();
  const ids = useMemo(() => new Set(existingIds), [existingIds]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [method, setMethod] = useState<HttpMethod>('POST');
  const [path, setPath] = useState('');
  const [description, setDescription] = useState('');

  const generatedId = uniqueSlug(slugify(title || path), ids);

  async function handleCreate() {
    const cleanTitle = title.trim();
    const cleanPath = path.trim();

    if (!cleanTitle || !cleanPath) {
      setError('Title and path are required.');
      return;
    }

    setSaving(true);
    setError('');

    const endpoint: Endpoint = {
      id: generatedId,
      title: cleanTitle,
      method,
      path: cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`,
      description: description.trim() || `Retrieve data from ${cleanTitle}.`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer {{access_token}}',
      },
      requestBody: '{\n  "startdate": "2025-04-24T19:53:32.616Z",\n  "enddate": "2025-04-24T19:53:32.616Z",\n  "assetname": "string"\n}',
      parameters: [
        { name: 'startdate', type: 'datetime', required: true, description: 'Start date for infringement search (ISO 8601 format).' },
        { name: 'enddate', type: 'datetime', required: false, description: 'End date for infringement search (ISO 8601 format).' },
        { name: 'assetname', type: 'string', required: false, description: 'Filter by specific asset/title name.' },
      ],
      responses: [{ status: 200, label: 'Success', body: '{\n  "message": "Success"\n}' }],
    };

    try {
      const res = await apiFetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...allContent,
          endpoints: {
            ...(allContent.endpoints || {}),
            [endpoint.id]: endpoint,
          },
        }),
        credentials: 'same-origin',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
        setError(`Failed: ${errData.error || res.statusText}`);
        setSaving(false);
        return;
      }

      router.push(`/admin/endpoints/${endpoint.id}`);
      router.refresh();
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <div className="mb-6">
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 text-white text-[13.5px] font-semibold rounded-md transition-colors"
          style={{ background: 'var(--color-brand)' }}
        >
          + Add Endpoint
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] p-5 mb-6" style={{ background: 'var(--color-card)' }}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-[16px] font-bold text-[var(--color-fg)]">Add Endpoint</h2>
          <p className="text-[13px] text-[var(--color-fg-muted)] mt-0.5">
            Create the endpoint, then edit request and response examples on the next screen.
          </p>
        </div>
        <button
          onClick={() => { setOpen(false); setError(''); }}
          className="text-[13px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[12px] font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} style={inputStyle} placeholder="LinkedIn" />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1">Method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value as HttpMethod)} className={inputCls} style={{ ...inputStyle, appearance: 'auto' }}>
            {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1">Path</label>
          <input value={path} onChange={(e) => setPath(e.target.value)} className={`${inputCls} font-mono`} style={inputStyle} placeholder="/getinfringements/LinkedIn" />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1">ID</label>
          <input value={generatedId} readOnly className={`${inputCls} font-mono opacity-80`} style={inputStyle} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[12px] font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inputCls} resize-none`} style={inputStyle} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-3">
        {error && <span className="text-[13px] text-[var(--color-error)]">{error}</span>}
        <button
          onClick={handleCreate}
          disabled={saving}
          className="px-5 py-2 text-white text-[13.5px] font-semibold rounded-md transition-colors disabled:opacity-60"
          style={{ background: 'var(--color-brand)' }}
        >
          {saving ? 'Creating...' : 'Create Endpoint'}
        </button>
      </div>
    </div>
  );
}
