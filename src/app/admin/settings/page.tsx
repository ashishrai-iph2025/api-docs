'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

const inputCls = 'w-full px-3 py-2 text-[13.5px] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 focus:border-[var(--color-brand)] transition';
const inputStyle = { background: 'var(--color-input-bg)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' };

export default function AdminSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (newPassword !== confirmPassword) { setError('New passwords do not match.'); return; }
    if (newPassword.length < 6) { setError('New password must be at least 6 characters.'); return; }
    setSaving(true);
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSaving(false);
    if (res.ok) {
      setSuccess('Password changed successfully. Your session stays active.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to change password.');
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
        <p className="text-[13px] text-[var(--color-fg-muted)] mt-0.5">Manage your admin panel configuration.</p>
      </div>

      <div className="max-w-md">
        <div className="rounded-xl border border-[var(--color-border)] p-6" style={{ background: 'var(--color-card)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--color-brand-subtle)', color: 'var(--color-brand)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[var(--color-fg)]">Change Password</h2>
              <p className="text-[12px] text-[var(--color-fg-muted)]">Update your admin login password</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Current Password', val: currentPassword, set: setCurrentPassword, ph: 'Enter current password' },
              { label: 'New Password',     val: newPassword,     set: setNewPassword,     ph: 'At least 6 characters' },
              { label: 'Confirm New Password', val: confirmPassword, set: setConfirmPassword, ph: 'Repeat new password' },
            ].map(({ label, val, set, ph }) => (
              <div key={label}>
                <label className="block text-[12px] font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1">
                  {label}
                </label>
                <input type="password" value={val} onChange={(e) => set(e.target.value)}
                  required placeholder={ph} className={inputCls} style={inputStyle} />
              </div>
            ))}

            {error && (
              <div className="text-[13px] text-[var(--color-error)] rounded-md px-3 py-2"
                style={{ background: 'color-mix(in srgb, var(--color-error) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-error) 20%, transparent)' }}>
                {error}
              </div>
            )}
            {success && (
              <div className="text-[13px] text-[var(--color-success)] rounded-md px-3 py-2 flex items-center gap-2"
                style={{ background: 'color-mix(in srgb, var(--color-success) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-success) 20%, transparent)' }}>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {success}
              </div>
            )}

            <button type="submit" disabled={saving}
              className="w-full py-2.5 text-white text-[14px] font-semibold rounded-md transition-colors disabled:opacity-60"
              style={{ background: 'var(--color-brand)' }}>
              {saving ? 'Changing Password…' : 'Change Password'}
            </button>
          </form>
        </div>

        <div className="mt-4 rounded-xl border border-[var(--color-border)] p-4" style={{ background: 'var(--color-surface)' }}>
          <div className="flex gap-2.5">
            <svg className="w-4 h-4 text-[var(--color-fg-muted)] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[12.5px] text-[var(--color-fg-muted)] leading-relaxed">
              The password is stored in{' '}
              <code className="font-mono text-[11px] px-1 rounded"
                style={{ background: 'var(--color-code-bg)', border: '1px solid var(--color-border)' }}>.env.local</code>{' '}
              on the server. After changing, your current session stays active.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
