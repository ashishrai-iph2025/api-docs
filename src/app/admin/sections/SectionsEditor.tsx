'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ContentData, SupportContact } from '@/lib/content-store';

const SECTION_TITLE_KEYS = [
  { id: 'introduction', default: 'Introduction', label: '1. Introduction' },
  { id: 'login', default: 'Login', label: '2. Login' },
  { id: 'authorization', default: 'Authorization via Token', label: '3. Authorization via Token' },
  { id: 'endpoints', default: 'API Endpoints', label: '4. API Endpoints (Overview)' },
  { id: 'json-dataset', default: 'JSON Response Dataset', label: '5. JSON Response Dataset' },
  { id: 'summary', default: 'Step by Step Summary', label: '6. Step by Step Summary' },
  { id: 'support', default: 'Support', label: '7. Support' },
];

type Tab = 'titles' | 'introduction' | 'login' | 'support' | 'authorization';

const inputCls = 'w-full px-3 py-2 text-[13.5px] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 focus:border-[var(--color-brand)] transition';
const inputStyle = { background: 'var(--color-input-bg)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' };
const labelCls = 'block text-[12px] font-semibold uppercase tracking-wide mb-1';
const sectionCls = 'rounded-xl border border-[var(--color-border)] p-6';

export function SectionsEditor({ initialData }: { initialData: ContentData }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('titles');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [sectionTitles, setSectionTitles] = useState<Record<string, string>>(initialData.sectionTitles || {});

  const [introBanner, setIntroBanner] = useState(
    initialData.introduction?.bannerText ?? 'Welcome to the API Monitoring Platform documentation.'
  );
  const [introPurpose, setIntroPurpose] = useState<string[]>(initialData.introduction?.purpose ?? []);
  const [introOverview, setIntroOverview] = useState<string[]>(initialData.introduction?.overview ?? []);

  const [loginDesc, setLoginDesc] = useState(initialData.login?.description ?? '');
  const [loginBaseUrl, setLoginBaseUrl] = useState(initialData.login?.baseUrl ?? 'https://api.markscan.co.in');
  const [loginPath, setLoginPath] = useState(initialData.login?.loginPath ?? '/Login');
  const [loginTokenExample, setLoginTokenExample] = useState(initialData.login?.tokenExample ?? '');
  const [loginErrUsername, setLoginErrUsername] = useState(initialData.login?.errorWrongUsername ?? '');
  const [loginErrPassword, setLoginErrPassword] = useState(initialData.login?.errorWrongPassword ?? '');

  const [supportDesc, setSupportDesc] = useState(initialData.support?.description ?? '');
  const [supportContacts, setSupportContacts] = useState<SupportContact[]>(initialData.support?.contacts ?? []);
  const [supportFooter, setSupportFooter] = useState(initialData.support?.footerNote ?? '');

  const [authDesc, setAuthDesc] = useState(initialData.authorization?.description ?? '');
  const [authHeaderNote, setAuthHeaderNote] = useState(initialData.authorization?.headerNote ?? '');
  const [authTokenExample, setAuthTokenExample] = useState(initialData.authorization?.tokenExample ?? '');

  function addContact() { setSupportContacts((c) => [...c, { name: '', email: '' }]); }
  function updateContact(i: number, field: keyof SupportContact, val: string) {
    setSupportContacts((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: val } : c)));
  }
  function removeContact(i: number) { setSupportContacts((prev) => prev.filter((_, idx) => idx !== i)); }

  function addPurposePara() { setIntroPurpose((p) => [...p, '']); }
  function updatePurposePara(i: number, val: string) { setIntroPurpose((p) => p.map((x, idx) => idx === i ? val : x)); }
  function removePurposePara(i: number) { setIntroPurpose((p) => p.filter((_, idx) => idx !== i)); }

  function addOverviewPara() { setIntroOverview((p) => [...p, '']); }
  function updateOverviewPara(i: number, val: string) { setIntroOverview((p) => p.map((x, idx) => idx === i ? val : x)); }
  function removeOverviewPara(i: number) { setIntroOverview((p) => p.filter((_, idx) => idx !== i)); }

  async function handleSave() {
    setSaving(true); setError(''); setSaved(false);
    const payload: ContentData = {
      ...initialData,
      sectionTitles,
      introduction: { bannerText: introBanner, purpose: introPurpose, overview: introOverview },
      login: { description: loginDesc, baseUrl: loginBaseUrl, loginPath, tokenExample: loginTokenExample, errorWrongUsername: loginErrUsername, errorWrongPassword: loginErrPassword },
      support: { description: supportDesc, contacts: supportContacts, footerNote: supportFooter },
      authorization: { description: authDesc, headerNote: authHeaderNote, tokenExample: authTokenExample },
    };
    const res = await fetch('/api/admin/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'same-origin',
    });
    setSaving(false);
    if (res.ok) { setSaved(true); router.refresh(); setTimeout(() => setSaved(false), 3000); }
    else { setError('Failed to save.'); }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'titles', label: 'Section Titles' },
    { id: 'introduction', label: 'Introduction' },
    { id: 'login', label: 'Login' },
    { id: 'authorization', label: 'Authorization' },
    { id: 'support', label: 'Support' },
  ];

  const removeBtn = (onClick: () => void) => (
    <button onClick={onClick} className="p-1.5 transition-colors" style={{ color: 'var(--color-fg-muted)' }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-error)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-fg-muted)')}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/dashboard" className="text-[13px] hover:text-[var(--color-brand)] transition-colors"
          style={{ color: 'var(--color-fg-muted)' }}>
          ← Dashboard
        </Link>
        <span style={{ color: 'var(--color-border-strong)' }}>/</span>
        <span className="text-[13px] font-medium" style={{ color: 'var(--color-fg)' }}>Sections & Text</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: 'var(--color-fg)' }}>Sections & Text</h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-fg-muted)' }}>
            Edit section titles, descriptions, contacts, and body text.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-[13px] font-medium flex items-center gap-1.5" style={{ color: 'var(--color-success)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
          {error && <span className="text-[13px]" style={{ color: 'var(--color-error)' }}>{error}</span>}
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-white text-[13.5px] font-semibold rounded-md transition-colors disabled:opacity-60"
            style={{ background: 'var(--color-brand)' }}>
            {saving ? 'Saving…' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 rounded-lg p-1 w-fit border border-[var(--color-border)]"
        style={{ background: 'var(--color-surface)' }}>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors"
            style={activeTab === tab.id
              ? { background: 'var(--color-brand)', color: '#fff' }
              : { color: 'var(--color-fg-muted)' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section Titles */}
      {activeTab === 'titles' && (
        <div className={sectionCls} style={{ background: 'var(--color-card)' }}>
          <h2 className="text-[15px] font-bold mb-1" style={{ color: 'var(--color-fg)' }}>Navigation Section Titles</h2>
          <p className="text-[13px] mb-5" style={{ color: 'var(--color-fg-muted)' }}>These titles appear in the sidebar and as page headings.</p>
          <div className="space-y-3">
            {SECTION_TITLE_KEYS.map((s) => (
              <div key={s.id} className="grid grid-cols-3 gap-4 items-center">
                <label className="text-[13px]" style={{ color: 'var(--color-fg-muted)' }}>{s.label}</label>
                <div className="col-span-2">
                  <input value={sectionTitles[s.id] ?? s.default}
                    onChange={(e) => setSectionTitles((prev) => ({ ...prev, [s.id]: e.target.value }))}
                    placeholder={s.default} className={inputCls} style={inputStyle} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Introduction */}
      {activeTab === 'introduction' && (
        <div className="space-y-5">
          <section className={sectionCls} style={{ background: 'var(--color-card)' }}>
            <h2 className="text-[15px] font-bold mb-4" style={{ color: 'var(--color-fg)' }}>Banner Text</h2>
            <textarea value={introBanner} onChange={(e) => setIntroBanner(e.target.value)} rows={3}
              className={`${inputCls} resize-none`} style={inputStyle} />
          </section>

          <section className={sectionCls} style={{ background: 'var(--color-card)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold" style={{ color: 'var(--color-fg)' }}>Purpose — Paragraphs</h2>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-fg-muted)' }}>Each paragraph appears under the "Purpose" heading.</p>
              </div>
              <button onClick={addPurposePara}
                className="text-[12px] px-3 py-1.5 rounded-md transition-colors"
                style={{ color: 'var(--color-brand)', border: '1px solid var(--color-brand-subtle)' }}>
                + Add Paragraph
              </button>
            </div>
            <div className="space-y-3">
              {introPurpose.map((para, i) => (
                <div key={i} className="flex gap-2">
                  <textarea value={para} onChange={(e) => updatePurposePara(i, e.target.value)} rows={3}
                    className={`flex-1 ${inputCls} resize-none`} style={inputStyle} />
                  {removeBtn(() => removePurposePara(i))}
                </div>
              ))}
            </div>
          </section>

          <section className={sectionCls} style={{ background: 'var(--color-card)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold" style={{ color: 'var(--color-fg)' }}>Platform Overview — Paragraphs</h2>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-fg-muted)' }}>Each paragraph appears under the "Platform Overview" heading.</p>
              </div>
              <button onClick={addOverviewPara}
                className="text-[12px] px-3 py-1.5 rounded-md transition-colors"
                style={{ color: 'var(--color-brand)', border: '1px solid var(--color-brand-subtle)' }}>
                + Add Paragraph
              </button>
            </div>
            <div className="space-y-3">
              {introOverview.map((para, i) => (
                <div key={i} className="flex gap-2">
                  <textarea value={para} onChange={(e) => updateOverviewPara(i, e.target.value)} rows={3}
                    className={`flex-1 ${inputCls} resize-none`} style={inputStyle} />
                  {removeBtn(() => removeOverviewPara(i))}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Login */}
      {activeTab === 'login' && (
        <div className="space-y-5">
          <section className={sectionCls} style={{ background: 'var(--color-card)' }}>
            <h2 className="text-[15px] font-bold mb-4" style={{ color: 'var(--color-fg)' }}>Login Section</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls} style={{ color: 'var(--color-fg-muted)' }}>Description</label>
                <textarea value={loginDesc} onChange={(e) => setLoginDesc(e.target.value)} rows={2}
                  className={`${inputCls} resize-none`} style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} style={{ color: 'var(--color-fg-muted)' }}>Base URL</label>
                  <input value={loginBaseUrl} onChange={(e) => setLoginBaseUrl(e.target.value)}
                    className={`${inputCls} font-mono`} style={inputStyle} />
                </div>
                <div>
                  <label className={labelCls} style={{ color: 'var(--color-fg-muted)' }}>Login Path</label>
                  <input value={loginPath} onChange={(e) => setLoginPath(e.target.value)}
                    className={`${inputCls} font-mono`} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className={labelCls} style={{ color: 'var(--color-fg-muted)' }}>Token Example (Success 200 response)</label>
                <textarea value={loginTokenExample} onChange={(e) => setLoginTokenExample(e.target.value)} rows={2}
                  className={`${inputCls} font-mono resize-none`} style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} style={{ color: 'var(--color-fg-muted)' }}>Error — Wrong Username (400)</label>
                  <input value={loginErrUsername} onChange={(e) => setLoginErrUsername(e.target.value)}
                    className={`${inputCls} font-mono`} style={inputStyle} />
                </div>
                <div>
                  <label className={labelCls} style={{ color: 'var(--color-fg-muted)' }}>Error — Wrong Password (400)</label>
                  <input value={loginErrPassword} onChange={(e) => setLoginErrPassword(e.target.value)}
                    className={`${inputCls} font-mono`} style={inputStyle} />
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Authorization */}
      {activeTab === 'authorization' && (
        <section className={sectionCls} style={{ background: 'var(--color-card)' }}>
          <h2 className="text-[15px] font-bold mb-4" style={{ color: 'var(--color-fg)' }}>Authorization Section</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls} style={{ color: 'var(--color-fg-muted)' }}>Intro Description</label>
              <textarea value={authDesc} onChange={(e) => setAuthDesc(e.target.value)} rows={2}
                className={`${inputCls} resize-none`} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'var(--color-fg-muted)' }}>Header Note</label>
              <textarea value={authHeaderNote} onChange={(e) => setAuthHeaderNote(e.target.value)} rows={2}
                className={`${inputCls} resize-none`} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'var(--color-fg-muted)' }}>Token Example</label>
              <input value={authTokenExample} onChange={(e) => setAuthTokenExample(e.target.value)}
                className={`${inputCls} font-mono`} style={inputStyle} />
            </div>
          </div>
        </section>
      )}

      {/* Support */}
      {activeTab === 'support' && (
        <div className="space-y-5">
          <section className={sectionCls} style={{ background: 'var(--color-card)' }}>
            <h2 className="text-[15px] font-bold mb-4" style={{ color: 'var(--color-fg)' }}>Support Section</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls} style={{ color: 'var(--color-fg-muted)' }}>Description</label>
                <textarea value={supportDesc} onChange={(e) => setSupportDesc(e.target.value)} rows={2}
                  className={`${inputCls} resize-none`} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={{ color: 'var(--color-fg-muted)' }}>Footer Note</label>
                <input value={supportFooter} onChange={(e) => setSupportFooter(e.target.value)}
                  className={inputCls} style={inputStyle} />
              </div>
            </div>
          </section>

          <section className={sectionCls} style={{ background: 'var(--color-card)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold" style={{ color: 'var(--color-fg)' }}>Support Contacts</h2>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-fg-muted)' }}>Names and email addresses shown on the Support page.</p>
              </div>
              <button onClick={addContact}
                className="text-[12px] px-3 py-1.5 rounded-md transition-colors"
                style={{ color: 'var(--color-brand)', border: '1px solid var(--color-brand-subtle)' }}>
                + Add Contact
              </button>
            </div>
            <div className="space-y-3">
              {supportContacts.map((c, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <input placeholder="Full Name" value={c.name}
                    onChange={(e) => updateContact(i, 'name', e.target.value)}
                    className={`flex-1 ${inputCls}`} style={inputStyle} />
                  <input placeholder="email@example.com" value={c.email}
                    onChange={(e) => updateContact(i, 'email', e.target.value)}
                    className={`flex-1 ${inputCls} font-mono`} style={inputStyle} />
                  {removeBtn(() => removeContact(i))}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <div className="flex justify-end pt-4 pb-4">
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2.5 text-white text-[14px] font-semibold rounded-md transition-colors disabled:opacity-60"
          style={{ background: 'var(--color-brand)' }}>
          {saving ? 'Saving…' : 'Save All Changes'}
        </button>
      </div>
    </>
  );
}
