'use client';

import { useEffect, useState, useRef } from 'react';
import { apiFetch } from '@/lib/csrf-client';
import clsx from 'clsx';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  is_active: number;
  otp_enabled: number;
  created_at: string;
  last_login: string | null;
  created_by: string | null;
}

type Modal = { type: 'create' } | { type: 'edit'; user: User } | { type: 'none' };

const ROLES = [
  { value: 'admin', label: 'Admin', desc: 'Full access to admin panel' },
  { value: 'user',  label: 'User',  desc: 'Limited access (future use)' },
];

export default function UsersPage() {
  const [users,   setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState<Modal>({ type: 'none' });
  const [busy,    setBusy]    = useState(false);
  const [toast,   setToast]   = useState('');

  useEffect(() => { fetchUsers(); }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res  = await apiFetch('/api/admin/users');
      const data = await res.json();
      if (res.ok) setUsers(data.users ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleOtp(user: User) {
    if (busy) return;
    setBusy(true);
    const newVal = !user.otp_enabled;
    try {
      const res = await apiFetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ otp_enabled: newVal }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, otp_enabled: newVal ? 1 : 0 } : u));
        setToast(`2FA ${newVal ? 'enabled' : 'disabled'} for ${user.name || user.email}.`);
      } else {
        const d = await res.json();
        setToast(d.error || 'Failed to update 2FA.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleActive(user: User) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: user.is_active ? 0 : 1 } : u));
        setToast(`${user.name} ${user.is_active ? 'deactivated' : 'activated'} successfully.`);
      } else {
        const d = await res.json();
        setToast(d.error || 'Failed to update user.');
      }
    } finally {
      setBusy(false);
    }
  }

  function fmt(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-[var(--color-fg)]">Users</h1>
          <p className="text-[13px] text-[var(--color-fg-muted)] mt-0.5">
            Manage admin access and user accounts.
          </p>
        </div>
        <button
          onClick={() => setModal({ type: 'create' })}
          className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white rounded-lg bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add user
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total users',  value: users.length },
          { label: 'Active',       value: users.filter(u => u.is_active).length },
          { label: 'Admins',       value: users.filter(u => u.role === 'admin').length },
        ].map(s => (
          <div
            key={s.label}
            className="rounded-xl border border-[var(--color-border)] px-5 py-4"
            style={{ background: 'var(--color-card)' }}
          >
            <div className="text-[24px] font-bold text-[var(--color-fg)]">{s.value}</div>
            <div className="text-[12px] text-[var(--color-fg-muted)] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div
        className="rounded-xl border border-[var(--color-border)] overflow-hidden"
        style={{ background: 'var(--color-card)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[var(--color-fg-muted)] text-[13px]">
            Loading users…
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <svg className="w-10 h-10 text-[var(--color-border-strong)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-[13px] text-[var(--color-fg-muted)]">No users yet. Add the first one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {['User', 'Role', 'Status', '2FA', 'Last login', 'Created', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr
                    key={u.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-brand)]/10 flex items-center justify-center text-[var(--color-brand)] font-semibold text-[13px] shrink-0">
                          {(u.name || u.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-[var(--color-fg)]">{u.name || '—'}</div>
                          <div className="text-[12px] text-[var(--color-fg-muted)]">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={clsx(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold',
                        u.role === 'admin'
                          ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      )}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={clsx(
                        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold',
                        u.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      )}>
                        <span className={clsx('w-1.5 h-1.5 rounded-full', u.is_active ? 'bg-green-500' : 'bg-red-500')} />
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggleOtp(u)}
                        disabled={busy}
                        title={u.otp_enabled ? 'Disable 2FA' : 'Enable 2FA'}
                        className={clsx(
                          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50',
                          u.otp_enabled ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-border-strong)]'
                        )}
                      >
                        <span className={clsx(
                          'inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200',
                          u.otp_enabled ? 'translate-x-4' : 'translate-x-0'
                        )} />
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--color-fg-muted)] whitespace-nowrap">
                      {fmt(u.last_login)}
                    </td>
                    <td className="px-5 py-3.5 text-[var(--color-fg-muted)] whitespace-nowrap">
                      {fmt(u.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setModal({ type: 'edit', user: u })}
                          className="px-3 py-1.5 text-[12px] font-medium rounded-md border border-[var(--color-border)] text-[var(--color-fg)] hover:bg-[var(--color-surface)] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={busy}
                          className={clsx(
                            'px-3 py-1.5 text-[12px] font-medium rounded-md border transition-colors disabled:opacity-50',
                            u.is_active
                              ? 'border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20'
                              : 'border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20'
                          )}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-border)] shadow-lg text-[13px] text-[var(--color-fg)]"
          style={{ background: 'var(--color-card)' }}>
          <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {toast}
        </div>
      )}

      {/* Modal */}
      {modal.type !== 'none' && (
        <UserModal
          mode={modal.type}
          user={modal.type === 'edit' ? modal.user : undefined}
          onClose={() => setModal({ type: 'none' })}
          onSaved={(msg) => { setToast(msg); fetchUsers(); setModal({ type: 'none' }); }}
        />
      )}
    </div>
  );
}

// ── User create/edit modal ────────────────────────────────────────────────────

function UserModal({
  mode, user, onClose, onSaved,
}: {
  mode: 'create' | 'edit';
  user?: User;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [name,  setName]  = useState(user?.name  ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [role,  setRole]  = useState<'admin' | 'user'>(user?.role ?? 'admin');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const url    = mode === 'create' ? '/api/admin/users' : `/api/admin/users/${user!.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const res    = await apiFetch(url, { method, body: JSON.stringify({ name, email, role }) });
      const data   = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
      onSaved(mode === 'create' ? `User "${name}" created.` : `User "${name}" updated.`);
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
        <h2 className="text-[17px] font-bold text-[var(--color-fg)] mb-5">
          {mode === 'create' ? 'Add new user' : 'Edit user'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Full name">
            <input ref={nameRef} type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Jane Smith" required disabled={saving} className={inputCls} style={inputStyle} />
          </Field>

          <Field label="Email address">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="jane@company.com" required disabled={saving || mode === 'edit'}
              className={clsx(inputCls, mode === 'edit' && 'opacity-70 cursor-not-allowed')}
              style={inputStyle} />
            {mode === 'edit' && (
              <p className="text-[11px] text-[var(--color-fg-muted)] mt-1">Email cannot be changed after creation.</p>
            )}
          </Field>

          <Field label="Role">
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value as 'admin' | 'user')}
                  className={clsx(
                    'text-left px-3.5 py-3 rounded-lg border text-[13px] transition-all',
                    role === r.value
                      ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/8'
                      : 'border-[var(--color-border)] hover:border-[var(--color-brand)]/40'
                  )}
                >
                  <div className={clsx('font-semibold', role === r.value ? 'text-[var(--color-brand)]' : 'text-[var(--color-fg)]')}>
                    {r.label}
                  </div>
                  <div className="text-[11px] text-[var(--color-fg-muted)] mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>
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
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-[13px] font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-fg)] hover:bg-[var(--color-surface)] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving || !name || !email}
              className="px-4 py-2 text-[13px] font-semibold rounded-lg text-white bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Saving…' : mode === 'create' ? 'Create user' : 'Save changes'}
            </button>
          </div>
        </form>
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

const inputCls = 'w-full px-3.5 py-2.5 text-[14px] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 focus:border-[var(--color-brand)] transition disabled:cursor-not-allowed';
const inputStyle = {
  background: 'var(--color-input-bg)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-fg)',
} as const;
