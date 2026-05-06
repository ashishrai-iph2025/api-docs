'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Endpoint, Parameter } from '@/data/types';
import type { ContentData } from '@/lib/content-store';

interface Props {
  endpoint: Endpoint;
  allContent: ContentData;
}

const inputCls = 'w-full px-3 py-2 text-[14px] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 focus:border-[var(--color-brand)] transition';
const inputStyle = { background: 'var(--color-input-bg)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' };

const sectionCls = 'rounded-xl border border-[var(--color-border)] p-6';

export function EndpointEditor({ endpoint, allContent }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle]           = useState(endpoint.title);
  const [path, setPath]             = useState(endpoint.path);
  const [method, setMethod]         = useState(endpoint.method);
  const [description, setDescription] = useState(endpoint.description);
  const [requestBody, setRequestBody] = useState(endpoint.requestBody || '');
  const [responseBody, setResponseBody] = useState(endpoint.responses[0]?.body || '');
  const [parameters, setParameters] = useState<Parameter[]>(endpoint.parameters || []);

  function addParam() {
    setParameters((p) => [...p, { name: '', type: 'string', required: false, description: '' }]);
  }
  function updateParam(index: number, field: keyof Parameter, value: string | boolean) {
    setParameters((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }
  function removeParam(index: number) {
    setParameters((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true); setError(''); setSaved(false);
    const payload: ContentData = {
      ...allContent,
      endpoints: {
        ...(allContent.endpoints || {}),
        [endpoint.id]: {
          id: endpoint.id,
          title, path, method, description,
          requestBody: requestBody || undefined,
          parameters,
          responses: [
            { status: endpoint.responses[0]?.status || 200, label: endpoint.responses[0]?.label || 'Success', body: responseBody },
            ...endpoint.responses.slice(1),
          ],
          headers: endpoint.headers,
        },
      },
    };
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin',
      });
      setSaving(false);
      if (res.ok) { setSaved(true); router.refresh(); setTimeout(() => setSaved(false), 3000); }
      else {
        const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
        setError(`Failed: ${errData.error || res.statusText}`);
      }
    } catch (err) {
      setSaving(false);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/endpoints" className="text-[13px] text-[var(--color-fg-muted)] hover:text-[var(--color-brand)]">
          ← Endpoints
        </Link>
        <span className="text-[var(--color-border-strong)]">/</span>
        <span className="text-[13px] text-[var(--color-fg)] font-medium">{endpoint.title}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[var(--color-fg)]">Edit Endpoint</h1>
          <p className="text-[13px] text-[var(--color-fg-muted)] mt-0.5">
            ID: <code className="font-mono text-[var(--color-fg)]">{endpoint.id}</code>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-[13px] text-[var(--color-success)] font-medium flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
          {error && <span className="text-[13px] text-[var(--color-error)]">{error}</span>}
          <button
            onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-white text-[13.5px] font-semibold rounded-md transition-colors disabled:opacity-60"
            style={{ background: 'var(--color-brand)' }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Basic info */}
        <section className={sectionCls} style={{ background: 'var(--color-card)' }}>
          <h2 className="text-[15px] font-bold text-[var(--color-fg)] mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as Endpoint['method'])}
                className={inputCls}
                style={{ ...inputStyle, appearance: 'auto' }}
              >
                {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[12px] font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1">Path</label>
              <input value={path} onChange={(e) => setPath(e.target.value)} className={`${inputCls} font-mono`} style={inputStyle} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[12px] font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                className={`${inputCls} resize-none`} style={inputStyle} />
            </div>
          </div>
        </section>

        {/* Parameters */}
        <section className={sectionCls} style={{ background: 'var(--color-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold text-[var(--color-fg)]">Parameters</h2>
            <button onClick={addParam}
              className="px-3 py-1.5 text-[12px] font-semibold text-[var(--color-brand)] border border-[var(--color-brand)]/30 rounded-md hover:bg-[var(--color-brand)]/5 transition-colors">
              + Add Parameter
            </button>
          </div>
          {parameters.length === 0 ? (
            <p className="text-[13px] text-[var(--color-fg-muted)]">No parameters defined.</p>
          ) : (
            <div className="space-y-3">
              {parameters.map((param, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-3">
                    <input placeholder="name" value={param.name} onChange={(e) => updateParam(i, 'name', e.target.value)}
                      className="w-full px-2 py-1.5 text-[13px] font-mono rounded focus:outline-none focus:border-[var(--color-brand)]"
                      style={inputStyle} />
                  </div>
                  <div className="col-span-2">
                    <input placeholder="type" value={param.type} onChange={(e) => updateParam(i, 'type', e.target.value)}
                      className="w-full px-2 py-1.5 text-[13px] rounded focus:outline-none focus:border-[var(--color-brand)]"
                      style={inputStyle} />
                  </div>
                  <div className="col-span-1 flex items-center justify-center pt-2">
                    <label className="flex items-center gap-1 text-[12px] text-[var(--color-fg-muted)] cursor-pointer">
                      <input type="checkbox" checked={param.required} onChange={(e) => updateParam(i, 'required', e.target.checked)}
                        className="accent-[var(--color-brand)]" />
                      Req
                    </label>
                  </div>
                  <div className="col-span-5">
                    <input placeholder="description" value={param.description} onChange={(e) => updateParam(i, 'description', e.target.value)}
                      className="w-full px-2 py-1.5 text-[13px] rounded focus:outline-none focus:border-[var(--color-brand)]"
                      style={inputStyle} />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button onClick={() => removeParam(i)}
                      className="p-1.5 text-[var(--color-fg-muted)] hover:text-[var(--color-error)] transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Request Body */}
        <section className={sectionCls} style={{ background: 'var(--color-card)' }}>
          <h2 className="text-[15px] font-bold text-[var(--color-fg)] mb-4">Request Body (JSON example)</h2>
          <textarea value={requestBody} onChange={(e) => setRequestBody(e.target.value)} rows={8} spellCheck={false}
            className={`${inputCls} font-mono resize-y`} style={inputStyle} />
        </section>

        {/* Response Body */}
        <section className={sectionCls} style={{ background: 'var(--color-card)' }}>
          <h2 className="text-[15px] font-bold text-[var(--color-fg)] mb-1">Response Body — 200 Success</h2>
          <p className="text-[12px] text-[var(--color-fg-muted)] mb-4">JSON example shown in the documentation.</p>
          <textarea value={responseBody} onChange={(e) => setResponseBody(e.target.value)} rows={20} spellCheck={false}
            className={`${inputCls} font-mono resize-y`} style={inputStyle} />
        </section>

        <div className="flex justify-end pb-4">
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 text-white text-[14px] font-semibold rounded-md transition-colors disabled:opacity-60"
            style={{ background: 'var(--color-brand)' }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
}
