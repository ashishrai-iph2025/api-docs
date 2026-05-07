'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/csrf-client';

const inputCls = 'w-full px-3 py-2 text-[13.5px] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 focus:border-[var(--color-brand)] transition';
const inputStyle = { background: 'var(--color-input-bg)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' };

export default function AdminSettingsPage() {
  const [smtpHost,   setSmtpHost]   = useState('');
  const [smtpPort,   setSmtpPort]   = useState('587');
  const [smtpSecure, setSmtpSecure] = useState('false');
  const [smtpUser,   setSmtpUser]   = useState('');
  const [smtpPass,   setSmtpPass]   = useState('');
  const [smtpFrom,   setSmtpFrom]   = useState('');
  const [hasPass,    setHasPass]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [success,    setSuccess]    = useState('');
  const [error,      setError]      = useState('');

  useEffect(() => {
    apiFetch('/api/admin/settings/smtp')
      .then(r => r.json())
      .then(d => {
        setSmtpHost(d.host);
        setSmtpPort(d.port);
        setSmtpSecure(d.secure);
        setSmtpUser(d.user);
        setSmtpPass(d.hasPass ? '••••••••' : '');
        setSmtpFrom(d.from);
        setHasPass(d.hasPass);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    setSaving(true);
    try {
      const res = await apiFetch('/api/admin/settings/smtp', {
        method: 'POST',
        body: JSON.stringify({
          host: smtpHost, port: smtpPort, secure: smtpSecure,
          user: smtpUser, pass: smtpPass, from: smtpFrom,
        }),
      });
      if (res.ok) {
        setSuccess('SMTP settings saved. Restart the server for changes to take effect.');
        setHasPass(!!smtpPass && smtpPass !== '••••••••' ? true : hasPass);
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to save settings.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/dashboard" className="text-[13px] text-[var(--color-fg-muted)] hover:text-[var(--color-brand)]">
          ← Dashboard
        </Link>
        <span className="text-[var(--color-border-strong)]">/</span>
        <span className="text-[13px] text-[var(--color-fg)] font-medium">Settings</span>
      </div>

      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[var(--color-fg)]">Settings</h1>
        <p className="text-[13px] text-[var(--color-fg-muted)] mt-0.5">Admin panel configuration.</p>
      </div>

      <div className="max-w-lg space-y-5">

        {/* ── SMTP / Email Settings ── */}
        <div className="rounded-xl border border-[var(--color-border)] p-6" style={{ background: 'var(--color-card)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-brand-subtle)', color: 'var(--color-brand)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[var(--color-fg)]">Email / SMTP</h2>
              <p className="text-[12px] text-[var(--color-fg-muted)]">Used to send OTP login codes to users</p>
            </div>
          </div>

          {loading ? (
            <p className="text-[13px] text-[var(--color-fg-muted)]">Loading…</p>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[11.5px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] mb-1">SMTP Host</label>
                  <input className={inputCls} style={inputStyle} placeholder="smtp.gmail.com"
                    value={smtpHost} onChange={e => setSmtpHost(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] mb-1">Port</label>
                  <input className={inputCls} style={inputStyle} placeholder="587"
                    value={smtpPort} onChange={e => setSmtpPort(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] mb-1">Encryption</label>
                <select className={inputCls} style={inputStyle}
                  value={smtpSecure} onChange={e => setSmtpSecure(e.target.value)}>
                  <option value="false">STARTTLS (port 587)</option>
                  <option value="true">SSL/TLS (port 465)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] mb-1">Username / Email</label>
                <input className={inputCls} style={inputStyle} placeholder="you@gmail.com"
                  autoComplete="off"
                  value={smtpUser} onChange={e => setSmtpUser(e.target.value)} />
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] mb-1">
                  Password / App Password
                  {hasPass && <span className="ml-2 normal-case font-normal text-[var(--color-success)]">— saved</span>}
                </label>
                <input className={inputCls} style={inputStyle} type="password"
                  placeholder={hasPass ? 'Leave blank to keep existing' : 'App password or SMTP password'}
                  autoComplete="new-password"
                  value={smtpPass} onChange={e => setSmtpPass(e.target.value)} />
                <p className="mt-1 text-[11.5px] text-[var(--color-fg-muted)]">
                  For Gmail, generate an <strong>App Password</strong> at myaccount.google.com → Security → App passwords.
                </p>
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] mb-1">From Address</label>
                <input className={inputCls} style={inputStyle} placeholder='MediaScan <noreply@example.com>'
                  value={smtpFrom} onChange={e => setSmtpFrom(e.target.value)} />
              </div>

              {error   && <p className="text-[13px] text-[var(--color-error)]">{error}</p>}
              {success && (
                <div className="rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/8 px-4 py-2.5 text-[13px] text-[var(--color-success)]">
                  {success}
                </div>
              )}

              <button type="submit" disabled={saving}
                className="w-full py-2.5 text-white text-[13.5px] font-semibold rounded-lg bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : 'Save SMTP Settings'}
              </button>
            </form>
          )}
        </div>

        {/* ── Auth info ── */}
        <div className="rounded-xl border border-[var(--color-border)] p-6" style={{ background: 'var(--color-card)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-brand-subtle)', color: 'var(--color-brand)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[var(--color-fg)]">Authentication</h2>
              <p className="text-[12px] text-[var(--color-fg-muted)]">Email OTP-based login</p>
            </div>
          </div>
          <ul className="space-y-2.5 text-[13px] text-[var(--color-fg-muted)]">
            {[
              'Login requires a one-time code sent to the registered email address.',
              'Sessions expire after 8 hours and are stored server-side.',
              'All state-changing requests are protected by CSRF tokens.',
              'OTP codes expire in 10 minutes, max 5 attempts. Rate-limited to 3 codes per 15 min.',
            ].map(t => (
              <li key={t} className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-[var(--color-success)] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Quick links ── */}
        {[
          { title: 'Manage Users', desc: 'Add, edit, or deactivate user accounts.', href: '/admin/users', cta: 'Go to Users →' },
          { title: 'Activity Log', desc: 'View all login and change events.', href: '/admin/activity', cta: 'View Activity →' },
        ].map(q => (
          <div key={q.href} className="rounded-xl border border-[var(--color-border)] p-5 flex items-center justify-between"
            style={{ background: 'var(--color-card)' }}>
            <div>
              <h3 className="text-[14px] font-semibold text-[var(--color-fg)]">{q.title}</h3>
              <p className="text-[12px] text-[var(--color-fg-muted)] mt-0.5">{q.desc}</p>
            </div>
            <Link href={q.href}
              className="px-4 py-2 text-[13px] font-semibold rounded-lg border border-[var(--color-border)] text-[var(--color-fg)] hover:bg-[var(--color-surface)] transition-colors whitespace-nowrap">
              {q.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
