'use client';

import { useState, useEffect, useRef, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [password, setPassword]         = useState('');
  const [error, setError]               = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [lockedFor, setLockedFor]       = useState(0);
  const [loading, setLoading]           = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/admin/dashboard';

  useEffect(() => {
    if (lockedFor <= 0) return;
    const id = setInterval(() => {
      setLockedFor((s) => {
        if (s <= 1) { clearInterval(id); setError(''); setAttemptsLeft(null); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [lockedFor]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function fmt(secs: number) {
    const m = Math.floor(secs / 60), s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (lockedFor > 0) return;
    setLoading(true); setError(''); setAttemptsLeft(null);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (res.ok) { router.replace(next); return; }
      if (res.status === 429) {
        setLockedFor(data.lockedFor ?? 900);
        setError(data.error);
      } else {
        setError(data.error || 'Incorrect password.');
        if (typeof data.attemptsLeft === 'number') setAttemptsLeft(data.attemptsLeft);
      }
      setPassword(''); inputRef.current?.focus();
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }

  const isLocked = lockedFor > 0;

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--color-surface)' }}
    >
      {/* Subtle grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(var(--color-brand) 1px, transparent 1px), linear-gradient(90deg, var(--color-brand) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-sm mx-4">
        <div
          className="rounded-2xl border border-[var(--color-border)] shadow-md px-8 py-10"
          style={{ background: 'var(--color-card)' }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-brand)] flex items-center justify-center text-white font-bold text-[15px] tracking-tight mb-3 shadow-sm">
              MS
            </div>
            <h1 className="text-[20px] font-bold text-[var(--color-fg)] tracking-tight">Admin Sign In</h1>
            <p className="text-[13px] text-[var(--color-fg-muted)] mt-1">MediaScan Developer Platform</p>
          </div>

          {/* Lockout banner */}
          {isLocked && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/8 px-4 py-3">
              <svg className="w-5 h-5 text-[var(--color-error)] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-[13px] font-semibold text-[var(--color-error)]">Account temporarily locked</p>
                <p className="text-[12px] text-[var(--color-error)] opacity-80 mt-0.5">
                  Too many failed attempts. Try again in{' '}
                  <span className="font-mono font-bold">{fmt(lockedFor)}</span>.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-[12px] font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                disabled={isLocked || loading}
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 text-[14px] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 focus:border-[var(--color-brand)] transition disabled:cursor-not-allowed"
                style={{
                  background: isLocked ? 'var(--color-surface)' : 'var(--color-input-bg)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-fg)',
                }}
              />
            </div>

            {error && !isLocked && (
              <div className="flex items-start gap-2 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/8 px-3.5 py-2.5">
                <svg className="w-4 h-4 text-[var(--color-error)] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div>
                  <p className="text-[13px] text-[var(--color-error)]">{error}</p>
                  {attemptsLeft !== null && attemptsLeft > 0 && (
                    <p className="text-[11.5px] text-[var(--color-error)] opacity-80 mt-0.5">
                      {attemptsLeft} attempt{attemptsLeft === 1 ? '' : 's'} left before lockout.
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLocked || loading || !password}
              className="w-full py-2.5 text-white text-[14px] font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              style={{ background: isLocked || loading ? 'var(--color-brand)' : 'var(--color-brand)' }}
              onMouseEnter={e => !isLocked && !loading && ((e.target as HTMLElement).style.background = 'var(--color-brand-hover)')}
              onMouseLeave={e => ((e.target as HTMLElement).style.background = 'var(--color-brand)')}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying…
                </span>
              ) : isLocked ? `Locked — ${fmt(lockedFor)}` : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-[11.5px] text-[var(--color-border-strong)]">
            Restricted access · MediaScan internal only
          </p>
        </div>

        <div className="mt-4 text-center">
          <a href="/" className="text-[13px] text-[var(--color-fg-muted)] hover:text-[var(--color-brand)] transition-colors">
            ← Back to MediaScan Docs
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
