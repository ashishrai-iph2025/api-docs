'use client';

import { useState, useEffect, useRef, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Step = 'email' | 'otp';

function LoginForm() {
  const [step,      setStep]      = useState<Step>('email');
  const [email,     setEmail]     = useState('');
  const [code,      setCode]      = useState('');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [countdown, setCountdown] = useState(0);

  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef  = useRef<HTMLInputElement>(null);
  const router   = useRouter();
  const params   = useSearchParams();

  useEffect(() => { emailRef.current?.focus(); }, []);
  useEffect(() => { if (step === 'otp') setTimeout(() => codeRef.current?.focus(), 80); }, [step]);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown(c => (c <= 1 ? (clearInterval(id), 0) : c - 1)), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  async function requestOtp(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true); setError('');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res  = await fetch('/api/admin/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'same-origin',
        signal: ctrl.signal,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }

      // 2FA disabled — log in directly
      if (data.otp_required === false) {
        const loginRes = await fetch('/api/admin/auth/direct-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
          credentials: 'same-origin',
          signal: ctrl.signal,
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) { setError(loginData.error || 'Login failed.'); return; }
        redirect(loginData.role, params.get('next') ?? '');
        return;
      }

      setStep('otp');
      setCountdown(60);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }

  async function verifyOtp(e: FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;
    setLoading(true); setError('');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res  = await fetch('/api/admin/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
        credentials: 'same-origin',
        signal: ctrl.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid code. Please try again.');
        setCode('');
        codeRef.current?.focus();
        return;
      }
      redirect(data.role, params.get('next') ?? '');
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }

  function redirect(role: string, next: string) {
    if (role === 'admin') {
      router.replace(next.startsWith('/') ? next : '/admin/dashboard');
    } else {
      router.replace(next.startsWith('/docs') ? next : '/docs/introduction');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--color-surface)' }}>

      {/* Subtle grid background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.025]" style={{
        backgroundImage: `linear-gradient(var(--color-brand) 1px, transparent 1px),
                          linear-gradient(90deg, var(--color-brand) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      {/* Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] opacity-[0.07] pointer-events-none"
        style={{ background: 'var(--color-brand)' }} />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-brand)] flex items-center justify-center text-white font-bold text-[15px] tracking-tight mb-4 shadow-lg shadow-[var(--color-brand)]/20">
            MS
          </div>
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--color-fg)' }}>
            MediaScan Developer Platform
          </h1>
          <p className="text-[13.5px] mt-1" style={{ color: 'var(--color-fg-muted)' }}>
            {step === 'email' ? 'Sign in to access the documentation' : `Enter the code sent to ${email}`}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[var(--color-border)] shadow-xl shadow-black/5 px-8 py-8"
          style={{ background: 'var(--color-card)' }}>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold transition-colors ${
              step === 'email' ? 'bg-[var(--color-brand)] text-white' : 'bg-[var(--color-success)] text-white'
            }`}>
              {step === 'email' ? '1' : '✓'}
            </div>
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold transition-colors ${
              step === 'otp' ? 'bg-[var(--color-brand)] text-white' : 'bg-[var(--color-border)] text-[var(--color-fg-muted)]'
            }`}>
              2
            </div>
          </div>

          {/* Step 1: email */}
          {step === 'email' && (
            <form onSubmit={requestOtp} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: 'var(--color-fg-muted)' }}>
                  Email address
                </label>
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@company.com"
                  required
                  disabled={loading}
                  autoComplete="email"
                  className="w-full px-3.5 py-2.5 text-[14px] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 focus:border-[var(--color-brand)] transition disabled:opacity-50"
                  style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
                />
              </div>

              <ErrorBox message={error} />

              <button type="submit" disabled={loading || !email}
                className="w-full py-2.5 text-white text-[14px] font-semibold rounded-lg bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <Spinner text="Sending code…" /> : 'Send verification code'}
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <form onSubmit={verifyOtp} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: 'var(--color-fg-muted)' }}>
                  Verification code
                </label>
                <input
                  ref={codeRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                  placeholder="000000"
                  required
                  disabled={loading}
                  autoComplete="one-time-code"
                  className="w-full px-3.5 py-3 text-[26px] font-mono text-center tracking-[0.4em] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 focus:border-[var(--color-brand)] transition disabled:opacity-50"
                  style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
                />
                <p className="mt-1.5 text-[12px] text-center" style={{ color: 'var(--color-fg-muted)' }}>
                  Check your inbox — code expires in 10 minutes
                </p>
              </div>

              <ErrorBox message={error} />

              <button type="submit" disabled={loading || code.length !== 6}
                className="w-full py-2.5 text-white text-[14px] font-semibold rounded-lg bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <Spinner text="Verifying…" /> : 'Verify & sign in'}
              </button>

              <div className="flex items-center justify-between pt-1">
                <button type="button"
                  onClick={() => { setStep('email'); setCode(''); setError(''); }}
                  className="text-[13px] transition-colors hover:text-[var(--color-brand)]"
                  style={{ color: 'var(--color-fg-muted)' }}>
                  ← Change email
                </button>
                <button type="button"
                  onClick={() => requestOtp()}
                  disabled={countdown > 0 || loading}
                  className="text-[13px] text-[var(--color-brand)] hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline">
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-[12px]" style={{ color: 'var(--color-fg-muted)' }}>
          Secure sign-in · MediaScan internal only
        </p>
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/8 px-3.5 py-2.5">
      <svg className="w-4 h-4 text-[var(--color-error)] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p className="text-[13px] text-[var(--color-error)]">{message}</p>
    </div>
  );
}

function Spinner({ text }: { text: string }) {
  return (
    <span className="flex items-center justify-center gap-2">
      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {text}
    </span>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
