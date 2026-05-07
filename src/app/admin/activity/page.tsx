'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/csrf-client';
import clsx from 'clsx';

interface ActivityLog {
  id: string;
  user_id: string | null;
  email: string | null;
  action: string;
  resource: string | null;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  login:              { label: 'Login',              color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
  logout:             { label: 'Logout',             color: 'text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400' },
  otp_requested:      { label: 'OTP Requested',      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
  otp_failed:         { label: 'OTP Failed',         color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' },
  page_view:          { label: 'Page View',          color: 'text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400' },
  user_created:       { label: 'User Created',       color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400' },
  user_updated:       { label: 'User Updated',       color: 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' },
  user_deactivated:   { label: 'User Deactivated',   color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' },
  user_activated:     { label: 'User Activated',     color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
  endpoint_updated:   { label: 'Endpoint Updated',   color: 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' },
  endpoint_deleted:   { label: 'Endpoint Deleted',   color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' },
  endpoint_enabled:   { label: 'Endpoint Enabled',   color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
  endpoint_disabled:  { label: 'Endpoint Disabled',  color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' },
  endpoint_reordered: { label: 'Endpoints Reordered',color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
  content_updated:    { label: 'Content Updated',    color: 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' },
};

const PAGE_SIZE = 50;

export default function ActivityPage() {
  const [logs,    setLogs]    = useState<ActivityLog[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(0);
  const [filter,  setFilter]  = useState({ action: '', email: '' });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.action) params.set('action',  filter.action);
      params.set('limit',  String(PAGE_SIZE));
      params.set('offset', String(page * PAGE_SIZE));
      const res  = await apiFetch(`/api/admin/activity?${params}`);
      const data = await res.json();
      if (res.ok) { setLogs(data.logs ?? []); setTotal(data.total ?? 0); }
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function fmt(iso: string) {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }

  function parseDetails(raw: string | null): string {
    if (!raw) return '';
    try { return JSON.stringify(JSON.parse(raw), null, 0).replace(/[{}"]/g, '').replace(/,/g, ' · '); }
    catch { return raw; }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const uniqueActions = Object.keys(ACTION_LABELS);

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-[var(--color-fg)]">Activity Log</h1>
          <p className="text-[13px] text-[var(--color-fg-muted)] mt-0.5">
            Track all user actions across the admin panel.
          </p>
        </div>
        <button
          onClick={() => fetchLogs()}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-fg)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
        >
          <svg className={clsx('w-4 h-4', loading && 'animate-spin')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total events',  value: total },
          { label: 'Logins',        value: logs.filter(l => l.action === 'login').length },
          { label: 'Failed OTPs',   value: logs.filter(l => l.action === 'otp_failed').length },
          { label: 'User changes',  value: logs.filter(l => l.action.startsWith('user_')).length },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-[var(--color-border)] px-5 py-4" style={{ background: 'var(--color-card)' }}>
            <div className="text-[22px] font-bold text-[var(--color-fg)]">{s.value}</div>
            <div className="text-[12px] text-[var(--color-fg-muted)] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filter.action}
          onChange={e => { setFilter(f => ({ ...f, action: e.target.value })); setPage(0); }}
          className="px-3 py-2 text-[13px] rounded-lg border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30"
          style={{ background: 'var(--color-input-bg)', color: 'var(--color-fg)' }}
        >
          <option value="">All actions</option>
          {uniqueActions.map(a => (
            <option key={a} value={a}>{ACTION_LABELS[a].label}</option>
          ))}
        </select>

        {(filter.action) && (
          <button
            onClick={() => { setFilter({ action: '', email: '' }); setPage(0); }}
            className="flex items-center gap-1.5 px-3 py-2 text-[13px] rounded-lg border border-[var(--color-border)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface)] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--color-border)] overflow-hidden" style={{ background: 'var(--color-card)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[var(--color-fg-muted)] text-[13px]">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <svg className="w-10 h-10 text-[var(--color-border-strong)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-[13px] text-[var(--color-fg-muted)]">No activity logs found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {['Time', 'User', 'Action', 'Details', 'IP address'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const badge = ACTION_LABELS[log.action] ?? { label: log.action, color: 'text-gray-500 bg-gray-100' };
                  return (
                    <tr key={log.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)] transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap text-[var(--color-fg-muted)] font-mono text-[12px]">
                        {fmt(log.created_at)}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="font-medium text-[var(--color-fg)]">{log.email || '—'}</div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold', badge.color)}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 max-w-[280px]">
                        <span className="text-[12px] text-[var(--color-fg-muted)] truncate block">
                          {parseDetails(log.details) || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-[var(--color-fg-muted)] font-mono text-[12px]">
                        {log.ip_address || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border)]">
            <span className="text-[12px] text-[var(--color-fg-muted)]">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} events
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                className="px-3 py-1.5 text-[12px] rounded-md border border-[var(--color-border)] text-[var(--color-fg)] hover:bg-[var(--color-surface)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                ← Prev
              </button>
              <span className="text-[12px] text-[var(--color-fg-muted)]">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-[12px] rounded-md border border-[var(--color-border)] text-[var(--color-fg)] hover:bg-[var(--color-surface)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
