'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/csrf-client';
import clsx from 'clsx';

interface Endpoint {
  id: string; title: string; method: string; path: string; requestBody?: string;
}
interface PlaygroundLog {
  id: string; endpoint_title: string; method: string; path: string;
  api_username: string | null; response_status: number | null;
  response_time_ms: number | null; token_issued: number; created_at: string;
  token_id?: string | null; token_preview?: string | null;
  user_email?: string; user_name?: string;
}
interface Stats {
  total_calls: number; success_calls: number; failed_calls: number;
  tokens_issued: number; avg_response_ms: number | null;
  by_endpoint: { endpoint_id: string; endpoint_title: string; count: number; success: number }[];
}
interface ActiveSession {
  id: string; user_id: string; user_email: string; user_name: string; user_role: string;
  ip_address: string | null; user_agent: string | null; created_at: string; expires_at: string;
}

type Tab = 'playground' | 'stats' | 'sessions';
type AuthMode = 'auto' | 'manual';

const TOKEN_KEY = 'pg_token';
const CREDS_KEY = 'pg_creds';

const inputCls = 'w-full px-3.5 py-2.5 text-[13px] rounded-lg border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 focus:border-[var(--color-brand)] transition';
const inputStyle = { background: 'var(--color-input-bg)', color: 'var(--color-fg)' } as const;

export default function AdminPlaygroundPage() {
  const [tab, setTab] = useState<Tab>('playground');
  const [authMode, setAuthMode] = useState<AuthMode>('auto');

  // auth
  const [apiUsername, setApiUsername] = useState('');
  const [apiPassword, setApiPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [token, setToken] = useState('');
  const [tokenMeta, setTokenMeta] = useState<{ generatedAt: string; apiUsername: string } | null>(null);
  const [tokenVisible, setTokenVisible] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authErrorDetail, setAuthErrorDetail] = useState<unknown>(null);

  // request
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<null | { success: boolean; status?: number; response: unknown; responseTimeMs: number }>(null);

  // misc
  const [logs, setLogs] = useState<PlaygroundLog[]>([]);
  const [showAllLogs, setShowAllLogs] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [currentSessId, setCurrentSessId] = useState('');
  const [busySession, setBusySession] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetch('/api/endpoints', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(d => {
        const eps: Endpoint[] = d.endpoints ?? [];
        setEndpoints(eps);
        if (eps.length > 0) { setSelectedId(eps[0].id); setRequestBody(eps[0].requestBody ?? '{}'); }
      }).catch(() => {});
    try {
      const c = sessionStorage.getItem(CREDS_KEY);
      if (c) { const { u, p } = JSON.parse(c); setApiUsername(u ?? ''); setApiPassword(p ?? ''); }
      const t = sessionStorage.getItem(TOKEN_KEY);
      if (t) { const { token: tk, meta } = JSON.parse(t); setToken(tk); setTokenMeta(meta); }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const loadLogs = useCallback(async (all: boolean) => {
    const url = all ? '/api/playground/logs?all=true&limit=50' : '/api/playground/logs?limit=50';
    const res = await fetch(url, { credentials: 'same-origin' });
    setLogs((await res.json()).logs ?? []);
  }, []);

  useEffect(() => { loadLogs(showAllLogs); }, [showAllLogs, loadLogs]);

  useEffect(() => {
    if (tab === 'stats') fetch('/api/playground/stats?all=true', { credentials: 'same-origin' }).then(r => r.json()).then(d => setStats(d.stats ?? null));
    if (tab === 'sessions') loadSessions();
  }, [tab]);

  async function loadSessions() {
    const res = await fetch('/api/admin/sessions', { credentials: 'same-origin' });
    const d = await res.json();
    setSessions(d.sessions ?? []); setCurrentSessId(d.currentSessionId ?? '');
  }

  function applyToken(tk: string, meta: { generatedAt: string; apiUsername: string }) {
    setToken(tk); setTokenMeta(meta);
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ token: tk, meta }));
    setAuthError(''); setAuthErrorDetail(null);
  }

  async function handleGenerateToken(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true); setAuthError(''); setAuthErrorDetail(null);
    try {
      sessionStorage.setItem(CREDS_KEY, JSON.stringify({ u: apiUsername, p: apiPassword }));
      const res = await apiFetch('/api/playground/token', { method: 'POST', body: JSON.stringify({ apiUsername, apiPassword }) });
      const data = await res.json();
      if (!data.success) {
        setAuthError(data.error ?? 'Authentication failed.');
        setAuthErrorDetail({ url: data.loginUrl, response: data.message ?? data.rawResponse });
        return;
      }
      applyToken(data.token, { generatedAt: data.generatedAt, apiUsername: data.apiUsername });
      setToast('Token generated.');
    } finally { setAuthLoading(false); }
  }

  function handleUseManualToken(e: React.FormEvent) {
    e.preventDefault();
    const tk = manualToken.trim().replace(/^Bearer\s+/i, '');
    if (!tk) return;
    applyToken(tk, { generatedAt: new Date().toISOString(), apiUsername: apiUsername || 'manual' });
    setToast('Token applied.');
  }

  function handleClearToken() {
    setToken(''); setTokenMeta(null); setManualToken('');
    setAuthError(''); setAuthErrorDetail(null);
    sessionStorage.removeItem(TOKEN_KEY);
  }

  function onEndpointChange(id: string) {
    setSelectedId(id);
    const ep = endpoints.find(e => e.id === id);
    if (ep) setRequestBody(ep.requestBody ?? '{}');
    setResult(null);
  }

  async function handleSend() {
    if (!token || !selectedId) return;
    setRunning(true); setResult(null);
    try {
      const res = await apiFetch('/api/playground/execute', {
        method: 'POST',
        body: JSON.stringify({ endpointId: selectedId, token, apiUsername: tokenMeta?.apiUsername, requestBody }),
      });
      setResult(await res.json());
      loadLogs(showAllLogs);
    } finally { setRunning(false); }
  }

  async function revokeSession(id: string) {
    setBusySession(id);
    try {
      await apiFetch(`/api/admin/sessions/${id}`, { method: 'DELETE' });
      setSessions(prev => prev.filter(s => s.id !== id));
      setToast('Session revoked.');
    } finally { setBusySession(''); }
  }

  async function copyToken() {
    await navigator.clipboard.writeText(token).catch(() => {});
    setTokenCopied(true); setTimeout(() => setTokenCopied(false), 1500);
  }

  const selectedEndpoint = endpoints.find(e => e.id === selectedId);
  const maskedToken = token ? `${token.slice(0, 24)}${'•'.repeat(18)}${token.slice(-10)}` : '';

  function sc(s?: number | null) {
    if (!s) return 'text-[var(--color-fg-muted)]';
    if (s < 300) return 'text-green-600 dark:text-green-400';
    if (s < 400) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  }
  function fmt(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const EyeIcon = ({ off }: { off?: boolean }) => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {off
        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
      }
    </svg>
  );

  const Spinner = () => (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[var(--color-fg)]">API Playground</h1>
        <p className="text-[13px] text-[var(--color-fg-muted)] mt-0.5">Generate a token once, then test any endpoint. Every call is logged.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[var(--color-border)]">
        {(['playground', 'stats', 'sessions'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={clsx('px-4 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors',
              tab === t ? 'border-[var(--color-brand)] text-[var(--color-brand)]' : 'border-transparent text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
            )}>
            {t === 'playground' ? 'Playground' : t === 'stats' ? 'Token & Usage Stats' : 'Active Sessions'}
          </button>
        ))}
      </div>

      {tab === 'playground' && (
        <div className="space-y-5">

          {/* ── Step 1: Auth ── */}
          <div className="rounded-xl border border-[var(--color-border)] overflow-hidden" style={{ background: 'var(--color-card)' }}>
            <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--color-brand)] text-white text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
                <div>
                  <h2 className="text-[14px] font-semibold text-[var(--color-fg)]">Login & Authorization</h2>
                  <p className="text-[12px] text-[var(--color-fg-muted)]">Authenticate once to get a Bearer token for all API calls.</p>
                </div>
              </div>
              {token && (
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-green-600 dark:text-green-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  Token active
                </span>
              )}
            </div>

            <div className="p-5">
              {/* Auth mode switcher */}
              <div className="flex gap-1 mb-5 p-1 rounded-lg bg-[var(--color-surface)] w-fit">
                {(['auto', 'manual'] as const).map(m => (
                  <button key={m} type="button"
                    onClick={() => { setAuthMode(m); setAuthError(''); setAuthErrorDetail(null); }}
                    className={clsx('px-4 py-1.5 text-[12px] font-medium rounded-md transition-all',
                      authMode === m ? 'bg-[var(--color-card)] text-[var(--color-fg)] shadow-sm' : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
                    )}>
                    {m === 'auto' ? 'Login with credentials' : 'Paste token manually'}
                  </button>
                ))}
              </div>

              {authMode === 'auto' ? (
                <form onSubmit={handleGenerateToken} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] mb-1.5">API Username</label>
                      <input type="text" value={apiUsername} onChange={e => setApiUsername(e.target.value)}
                        placeholder="Enter your API username" autoComplete="off" required
                        className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] mb-1.5">API Password</label>
                      <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} value={apiPassword}
                          onChange={e => setApiPassword(e.target.value)}
                          placeholder="Enter your API password" autoComplete="off" required
                          className={clsx(inputCls, 'pr-10')} style={inputStyle} />
                        <button type="button" onClick={() => setShowPassword(s => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors">
                          <EyeIcon off={showPassword} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {authError && (
                    <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                      <div className="flex items-start gap-2 px-3.5 py-2.5 text-[13px] text-red-700 dark:text-red-400">
                        <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{authError}</p>
                          {authErrorDetail != null && (
                            <details className="mt-2">
                              <summary className="text-[11px] cursor-pointer opacity-70 hover:opacity-100 select-none">Show details</summary>
                              <pre className="mt-1.5 text-[11px] font-mono whitespace-pre-wrap break-all opacity-80 max-h-40 overflow-auto">
                                {JSON.stringify(authErrorDetail, null, 2)}
                              </pre>
                            </details>
                          )}
                          <p className="mt-1.5 text-[12px] opacity-70">
                            If login keeps failing, switch to{' '}
                            <button type="button" className="underline font-medium"
                              onClick={() => setAuthMode('manual')}>Paste token manually</button>
                            {' '}(get your token from Postman or curl).
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button type="submit" disabled={authLoading || !apiUsername || !apiPassword}
                      className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-white rounded-lg bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {authLoading ? <><Spinner />Authenticating…</> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>{token ? 'Re-generate Token' : 'Generate Token'}</>}
                    </button>
                    {token && (
                      <button type="button" onClick={handleClearToken}
                        className="px-4 py-2.5 text-[13px] font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-fg-muted)] hover:text-[var(--color-error)] hover:border-[var(--color-error)]/40 transition-colors">
                        Clear Token
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <form onSubmit={handleUseManualToken} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] mb-1.5">
                      Bearer Token <span className="normal-case font-normal opacity-60">— paste from Postman, curl, or your app</span>
                    </label>
                    <textarea value={manualToken} onChange={e => setManualToken(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      rows={4} spellCheck={false} required
                      className="w-full px-3.5 py-2.5 text-[13px] font-mono rounded-lg border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 focus:border-[var(--color-brand)] transition resize-none"
                      style={inputStyle} />
                    <p className="text-[11px] text-[var(--color-fg-muted)] mt-1">The <code className="font-mono">Bearer </code> prefix is stripped automatically.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="submit" disabled={!manualToken.trim()}
                      className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-white rounded-lg bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Use This Token
                    </button>
                    {token && (
                      <button type="button" onClick={handleClearToken}
                        className="px-4 py-2.5 text-[13px] font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-fg-muted)] hover:text-[var(--color-error)] transition-colors">
                        Clear Token
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* Token display */}
              {token && (
                <div className="mt-5 p-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/15">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="text-[13px] font-semibold text-green-700 dark:text-green-400">Bearer Token Ready</span>
                      {tokenMeta && (
                        <span className="text-[11px] text-green-600/70 dark:text-green-500">
                          · {tokenMeta.apiUsername !== 'manual' ? tokenMeta.apiUsername : 'manual paste'} · {fmt(tokenMeta.generatedAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setTokenVisible(v => !v)} className="text-[11px] text-green-700 dark:text-green-400 hover:underline">{tokenVisible ? 'Hide' : 'Show'}</button>
                      <button onClick={copyToken} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                        {tokenCopied ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <code className="block text-[12px] font-mono break-all text-green-800 dark:text-green-300 bg-green-100/50 dark:bg-green-900/30 px-3 py-2 rounded">
                    {tokenVisible ? token : maskedToken}
                  </code>
                  <p className="mt-2 text-[11px] text-green-600/80 dark:text-green-500">This token is used automatically for all requests in Step 2.</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Step 2: Test Endpoint ── */}
          <div className={clsx('rounded-xl border overflow-hidden', token ? 'border-[var(--color-border)]' : 'border-[var(--color-border)] opacity-60 pointer-events-none')} style={{ background: 'var(--color-card)' }}>
            <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-[var(--color-brand)] text-white text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
              <div>
                <h2 className="text-[14px] font-semibold text-[var(--color-fg)]">Test Endpoint</h2>
                <p className="text-[12px] text-[var(--color-fg-muted)]">{token ? 'Select an endpoint and send your request.' : 'Complete Step 1 first.'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-[var(--color-border)]">
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] mb-1.5">Endpoint</label>
                  <div className="flex items-center gap-2">
                    {selectedEndpoint && (
                      <span className={clsx('shrink-0 px-2 py-0.5 text-[11px] font-bold rounded',
                        selectedEndpoint.method === 'GET' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      )}>
                        {selectedEndpoint.method}
                      </span>
                    )}
                    <select value={selectedId} onChange={e => onEndpointChange(e.target.value)}
                      className="flex-1 px-3 py-2 text-[13px] rounded-lg border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30"
                      style={{ background: 'var(--color-input-bg)', color: 'var(--color-fg)' }}>
                      {endpoints.map(e => <option key={e.id} value={e.id}>{e.title} — {e.path}</option>)}
                    </select>
                  </div>
                </div>

                {selectedEndpoint?.method !== 'GET' && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] mb-1.5">Request Body (JSON)</label>
                    <textarea value={requestBody} onChange={e => setRequestBody(e.target.value)} rows={9} spellCheck={false}
                      className="w-full px-3 py-2.5 text-[13px] font-mono rounded-lg border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 resize-y"
                      style={{ background: 'var(--color-input-bg)', color: 'var(--color-fg)' }} />
                  </div>
                )}

                <button onClick={handleSend} disabled={running || !token || !selectedId}
                  className="w-full py-2.5 text-[13px] font-semibold text-white rounded-lg bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {running ? <><Spinner />Sending…</> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>Send Request</>}
                </button>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[12px] font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide">Response</span>
                  {result && (
                    <>
                      <span className={clsx('text-[13px] font-bold', sc(result.status))}>{result.status ?? '—'}</span>
                      <span className="text-[12px] text-[var(--color-fg-muted)]">{result.responseTimeMs}ms</span>
                      <span className={clsx('text-[11px] px-2 py-0.5 rounded-full font-semibold',
                        result.success ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      )}>
                        {result.success ? 'Success' : 'Failed'}
                      </span>
                    </>
                  )}
                </div>
                {!result && !running && (
                  <div className="flex flex-col items-center justify-center py-20 text-[var(--color-fg-muted)]">
                    <svg className="w-10 h-10 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="text-[13px]">Response will appear here.</p>
                  </div>
                )}
                {running && <div className="flex items-center justify-center py-20"><svg className="w-8 h-8 animate-spin text-[var(--color-brand)]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>}
                {result && !running && (
                  <pre className="text-[12px] font-mono overflow-auto max-h-[500px] p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] whitespace-pre-wrap break-all">
                    {typeof result.response === 'string' ? result.response : JSON.stringify(result.response, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>

          {/* Recent call log */}
          <div className="rounded-xl border border-[var(--color-border)] overflow-hidden" style={{ background: 'var(--color-card)' }}>
            <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-[var(--color-fg)]">Recent Calls</h2>
              <label className="flex items-center gap-2 text-[12px] text-[var(--color-fg-muted)] cursor-pointer select-none">
                <input type="checkbox" checked={showAllLogs} onChange={e => setShowAllLogs(e.target.checked)} className="rounded" />
                All users
              </label>
            </div>
            <div className="overflow-x-auto">
              {logs.length === 0 ? <p className="px-5 py-8 text-[13px] text-[var(--color-fg-muted)] text-center">No calls yet.</p> : (
                <table className="w-full text-[12px]">
                  <thead><tr className="border-b border-[var(--color-border)]">
                    {['Endpoint', showAllLogs ? 'User' : null, 'Status', 'Time', 'When'].filter(Boolean).map(h => (
                      <th key={h!} className="text-left px-4 py-2.5 text-[11px] font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {logs.map(l => (
                      <tr key={l.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)]">
                        <td className="px-4 py-2.5"><div className="font-medium text-[var(--color-fg)]">{l.endpoint_title}</div><div className="text-[11px] text-[var(--color-fg-muted)] font-mono truncate max-w-[200px]">{l.path}</div></td>
                        {showAllLogs && <td className="px-4 py-2.5 text-[var(--color-fg-muted)]">{l.user_email ?? '—'}</td>}
                        <td className={clsx('px-4 py-2.5 font-semibold', sc(l.response_status))}>{l.response_status ?? '—'}</td>
                        <td className="px-4 py-2.5 text-[var(--color-fg-muted)]">{l.response_time_ms != null ? `${l.response_time_ms}ms` : '—'}</td>
                        <td className="px-4 py-2.5 text-[var(--color-fg-muted)] whitespace-nowrap">{fmt(l.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats tab */}
      {tab === 'stats' && (
        <div className="space-y-6">
          {!stats ? <p className="text-[13px] text-[var(--color-fg-muted)]">Loading…</p> : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[{ label: 'Total Calls', value: stats.total_calls }, { label: 'Successful', value: stats.success_calls }, { label: 'Failed', value: stats.failed_calls }, { label: 'Tokens Issued', value: stats.tokens_issued }, { label: 'Avg Response', value: stats.avg_response_ms != null ? `${Math.round(stats.avg_response_ms)}ms` : '—' }].map(s => (
                  <div key={s.label} className="rounded-xl border border-[var(--color-border)] px-5 py-4" style={{ background: 'var(--color-card)' }}>
                    <div className="text-[24px] font-bold text-[var(--color-fg)]">{s.value}</div>
                    <div className="text-[12px] text-[var(--color-fg-muted)] mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-[var(--color-border)] overflow-hidden" style={{ background: 'var(--color-card)' }}>
                <div className="px-5 py-4 border-b border-[var(--color-border)]"><h2 className="text-[14px] font-semibold text-[var(--color-fg)]">Hits by Endpoint (all users)</h2></div>
                {stats.by_endpoint.length === 0 ? <p className="px-5 py-8 text-[13px] text-[var(--color-fg-muted)] text-center">No data yet.</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead><tr className="border-b border-[var(--color-border)]">{['Endpoint', 'Total Hits', 'Success', 'Failed', 'Success Rate'].map(h => <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider">{h}</th>)}</tr></thead>
                      <tbody>
                        {stats.by_endpoint.map(ep => {
                          const rate = ep.count > 0 ? Math.round((ep.success / ep.count) * 100) : 0;
                          return (
                            <tr key={ep.endpoint_id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)]">
                              <td className="px-5 py-3 font-medium text-[var(--color-fg)]">{ep.endpoint_title}</td>
                              <td className="px-5 py-3 font-semibold text-[var(--color-brand)]">{ep.count}</td>
                              <td className="px-5 py-3 text-green-600 dark:text-green-400">{ep.success}</td>
                              <td className="px-5 py-3 text-red-500">{ep.count - ep.success}</td>
                              <td className="px-5 py-3"><div className="flex items-center gap-2"><div className="flex-1 h-1.5 rounded-full bg-[var(--color-border)]"><div className="h-1.5 rounded-full bg-green-500" style={{ width: `${rate}%` }} /></div><span className="text-[12px] text-[var(--color-fg-muted)] w-8 text-right">{rate}%</span></div></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Sessions tab */}
      {tab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-[var(--color-fg-muted)]">All active login sessions. Revoke any session to force that user out immediately.</p>
            <button onClick={loadSessions} className="px-3 py-1.5 text-[12px] font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-fg)] hover:bg-[var(--color-surface)] transition-colors">Refresh</button>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] overflow-hidden" style={{ background: 'var(--color-card)' }}>
            {sessions.length === 0 ? <p className="px-5 py-10 text-[13px] text-[var(--color-fg-muted)] text-center">No active sessions.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead><tr className="border-b border-[var(--color-border)]">{['User', 'Role', 'IP Address', 'Device', 'Started', 'Expires', 'Action'].map(h => <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider">{h}</th>)}</tr></thead>
                  <tbody>
                    {sessions.map(s => (
                      <tr key={s.id} className={clsx('border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)]', s.id === currentSessId && 'bg-[var(--color-brand-subtle)]')}>
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-[var(--color-fg)]">{s.user_name || '—'}</div>
                          <div className="text-[12px] text-[var(--color-fg-muted)]">{s.user_email}</div>
                          {s.id === currentSessId && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-brand)]/15 text-[var(--color-brand)] font-semibold">Current</span>}
                        </td>
                        <td className="px-5 py-3.5"><span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold', s.user_role === 'admin' ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400')}>{s.user_role}</span></td>
                        <td className="px-5 py-3.5 font-mono text-[12px] text-[var(--color-fg-muted)]">{s.ip_address ?? '—'}</td>
                        <td className="px-5 py-3.5 max-w-[180px]"><p className="text-[11px] text-[var(--color-fg-muted)] truncate" title={s.user_agent ?? ''}>{s.user_agent ? s.user_agent.substring(0, 60) : '—'}</p></td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-[12px] text-[var(--color-fg-muted)]">{fmt(s.created_at)}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-[12px] text-[var(--color-fg-muted)]">{fmt(s.expires_at)}</td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => revokeSession(s.id)} disabled={busySession === s.id || s.id === currentSessId}
                            title={s.id === currentSessId ? 'Cannot revoke your own session' : 'Force this user out'}
                            className="px-3 py-1.5 text-[12px] font-medium rounded-md border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                            {busySession === s.id ? '…' : 'Revoke'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-border)] shadow-lg text-[13px] text-[var(--color-fg)]" style={{ background: 'var(--color-card)' }}>
          <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          {toast}
        </div>
      )}
    </div>
  );
}
