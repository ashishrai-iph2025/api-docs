'use client';

import Link from 'next/link';
import { useRef, useState, useCallback } from 'react';
import type { Endpoint } from '@/data/types';

interface Props {
  initialEndpoints: Endpoint[];
}

export function EndpointsList({ initialEndpoints }: Props) {
  const [endpoints, setEndpoints] = useState(initialEndpoints);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const dragIndex = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  const showSaved = () => {
    setSavedMsg('Saved');
    setTimeout(() => setSavedMsg(''), 2000);
  };

  const saveOrder = useCallback(async (ordered: Endpoint[]) => {
    setSaving(true);
    setSavedMsg('');
    try {
      await fetch('/api/admin/endpoints/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: ordered.map((e) => e.id) }),
      });
      showSaved();
    } finally {
      setSaving(false);
    }
  }, []);

  const move = useCallback((from: number, to: number) => {
    setEndpoints((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      saveOrder(next);
      return next;
    });
  }, [saveOrder]);

  const toggleActive = useCallback(async (id: string, active: boolean) => {
    setSaving(true);
    setSavedMsg('');
    setEndpoints((prev) => prev.map((ep) => ep.id === id ? { ...ep, active } : ep));
    try {
      await fetch('/api/admin/endpoints/toggle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active }),
      });
      showSaved();
    } finally {
      setSaving(false);
    }
  }, []);

  // Drag handlers
  const onDragStart = (i: number) => { dragIndex.current = i; };
  const onDragEnter = (i: number) => { dragOverIndex.current = i; };
  const onDragEnd = () => {
    const from = dragIndex.current;
    const to = dragOverIndex.current;
    dragIndex.current = null;
    dragOverIndex.current = null;
    if (from === null || to === null || from === to) return;
    move(from, to);
  };

  return (
    <div className="rounded-xl border border-[var(--color-border)] overflow-hidden" style={{ background: 'var(--color-card)' }}>
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--color-border)]">
        <span className="text-[12px] text-[var(--color-fg-muted)]">Drag rows or use arrows to reorder. Toggle to show/hide from public docs.</span>
        {saving && <span className="text-[12px] text-[var(--color-fg-muted)]">Saving…</span>}
        {!saving && savedMsg && <span className="text-[12px] text-green-500">{savedMsg}</span>}
      </div>
      <div className="divide-y divide-[var(--color-border)]">
        {endpoints.map((ep, i) => {
          const isActive = ep.active !== false;
          return (
            <div
              key={ep.id}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragEnter={() => onDragEnter(i)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`flex items-center gap-3 px-4 py-3 transition-colors group cursor-grab active:cursor-grabbing ${
                isActive ? 'hover:bg-[var(--color-surface)]' : 'opacity-50 hover:opacity-70 hover:bg-[var(--color-surface)]'
              }`}
            >
              {/* Drag handle */}
              <svg className="w-4 h-4 text-[var(--color-border-strong)] shrink-0 opacity-50 group-hover:opacity-100" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 4a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2zM7 10a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2zM7 16a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" />
              </svg>

              {/* Up/Down buttons */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  onClick={() => i > 0 && move(i, i - 1)}
                  disabled={i === 0}
                  className="p-0.5 rounded text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] disabled:opacity-20 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => i < endpoints.length - 1 && move(i, i + 1)}
                  disabled={i === endpoints.length - 1}
                  className="p-0.5 rounded text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] disabled:opacity-20 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <span className="text-[12px] text-[var(--color-fg-muted)] w-6 shrink-0 text-center">{i + 1}</span>

              {/* Active toggle */}
              <button
                onClick={() => toggleActive(ep.id, !isActive)}
                title={isActive ? 'Deactivate (hide from public docs)' : 'Activate (show in public docs)'}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                  isActive ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-border-strong)]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                    isActive ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>

              <Link
                href={`/admin/endpoints/${ep.id}`}
                className="flex items-center gap-3 flex-1 min-w-0"
                onClick={(e) => e.stopPropagation()}
              >
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
                  {!isActive && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--color-border)] text-[var(--color-fg-muted)] font-medium">
                      Hidden
                    </span>
                  )}
                  <span className="text-[12px] text-[var(--color-brand)] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Edit
                  </span>
                  <svg className="w-4 h-4 text-[var(--color-border-strong)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
