'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { apiFetch } from '@/lib/csrf-client';

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirm,         setConfirm]         = useState('');
  const [showPw,          setShowPw]          = useState(false);
  const [error,           setError]           = useState('');
  const [success,         setSuccess]         = useState(false);
  const [saving,          setSaving]          = useState(false);
  const currentRef = useRef<HTMLInputElement>(null);

  useEffect(() => { currentRef.current?.focus(); }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const mismatch = confirm && newPassword !== confirm;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) { setError('Passwords do not match.'); return; }
    if (newPassword.length < 8)  { setError('New password must be at least 8 characters.'); return; }
    setSaving(true); setError('');
    try {
      const res  = await apiFetch('/api/account/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to change password.'); return; }
      setSuccess(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl border border-[var(--color-border)] shadow-xl px-8 py-7"
        style={{ background: 'var(--color-card)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-[17px] font-bold text-[var(--color-fg)] mb-1">Change password</h2>
        <p className="text-[13px] text-[var(--color-fg-muted)] mb-5">Update your account password.</p>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[14px] font-medium text-[var(--color-fg)]">Password changed successfully</p>
            <button
              onClick={onClose}
              className="px-5 py-2 text-[13px] font-semibold rounded-lg text-white bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Current password">
              <div className="relative">
                <input
                  ref={currentRef}
                  type={showPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => { setCurrentPassword(e.target.value); setError(''); }}
                  placeholder="Your current password"
                  required
                  disabled={saving}
                  autoComplete="current-password"
                  className={inputCls}
                  style={inputStyle}
                />
                <EyeToggle show={showPw} onToggle={() => setShowPw(s => !s)} />
              </div>
            </Field>

            <Field label="New password">
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setError(''); }}
                  placeholder="Min. 8 characters"
                  required
                  disabled={saving}
                  autoComplete="new-password"
                  className={inputCls}
                  style={inputStyle}
                />
                <EyeToggle show={showPw} onToggle={() => setShowPw(s => !s)} />
              </div>
            </Field>

            <Field label="Confirm new password">
              <input
                type={showPw ? 'text' : 'password'}
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(''); }}
                placeholder="Re-enter new password"
                required
                disabled={saving}
                autoComplete="new-password"
                className={`${inputCls} ${mismatch ? '!border-[var(--color-error)]' : ''}`}
                style={inputStyle}
              />
              {mismatch && (
                <p className="text-[11px] text-[var(--color-error)] mt-1">Passwords do not match.</p>
              )}
            </Field>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/8 px-3.5 py-2.5">
                <svg className="w-4 h-4 text-[var(--color-error)] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-[13px] text-[var(--color-error)]">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} disabled={saving}
                className="px-4 py-2 text-[13px] font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-fg)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !currentPassword || !newPassword || !confirm || !!mismatch}
                className="px-4 py-2 text-[13px] font-semibold rounded-lg text-white bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : 'Change password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
    >
      {show ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );
}

const inputCls = 'w-full px-3.5 py-2.5 text-[14px] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 focus:border-[var(--color-brand)] transition disabled:opacity-50 disabled:cursor-not-allowed';
const inputStyle = {
  background: 'var(--color-input-bg)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-fg)',
} as const;
