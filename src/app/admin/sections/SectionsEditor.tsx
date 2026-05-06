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

export function SectionsEditor({ initialData }: { initialData: ContentData }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('titles');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Section Titles
  const [sectionTitles, setSectionTitles] = useState<Record<string, string>>(
    initialData.sectionTitles || {}
  );

  // Introduction
  const [introBanner, setIntroBanner] = useState(
    initialData.introduction?.bannerText ?? 'Welcome to the API Monitoring Platform documentation. This portal is organized like a reference guide — pick a topic from the sidebar or use the search bar above.'
  );
  const [introPurpose, setIntroPurpose] = useState<string[]>(
    initialData.introduction?.purpose ?? [
      'This document outlines the primary objective of granting external users access to the APIs provided by the API Monitoring Platform. The purpose is to empower authorized external entities — such as monitoring companies, content owners, and rights holders — with the ability to programmatically retrieve comprehensive data related to intellectual-property infringements.',
      'Through these APIs, external users can efficiently access detailed reports on various types of infringement, including but not limited to piracy-related videos, posts, or content that has been identified and captured across a range of digital platforms. This access facilitates timely monitoring, investigation, and management of infringement cases, allowing users to take further action such as implementing anti-piracy measures or initiating legal proceedings.',
    ]
  );
  const [introOverview, setIntroOverview] = useState<string[]>(
    initialData.introduction?.overview ?? [
      'External users — such as monitoring companies or rights holders — can use the API to access identified pirate videos and posts captured by our platform.',
      'This API provides a comprehensive view of infringement data, enabling companies and rights holders to retrieve detailed reports across a wide spectrum of online sources including social-media platforms, messaging applications such as Telegram, and User-Generated Content (UGC) platforms.',
      'Through this API, companies and rights holders can manage and analyze piracy incidents end-to-end.',
    ]
  );

  // Login
  const [loginDesc, setLoginDesc] = useState(
    initialData.login?.description ?? 'Use your shared credentials to generate a JWT token. This token must then be used to authorize every subsequent API call.'
  );
  const [loginBaseUrl, setLoginBaseUrl] = useState(
    initialData.login?.baseUrl ?? 'https://api.markscan.co.in'
  );
  const [loginPath, setLoginPath] = useState(
    initialData.login?.loginPath ?? '/Login'
  );
  const [loginTokenExample, setLoginTokenExample] = useState(
    initialData.login?.tokenExample ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8y...'
  );
  const [loginErrUsername, setLoginErrUsername] = useState(
    initialData.login?.errorWrongUsername ?? 'Invalid user credentials!'
  );
  const [loginErrPassword, setLoginErrPassword] = useState(
    initialData.login?.errorWrongPassword ?? 'Invalid password! Please retry with correct credentials.'
  );

  // Support
  const [supportDesc, setSupportDesc] = useState(
    initialData.support?.description ?? 'For any technical assistance or issues with the API Monitoring Platform, please reach out to the contacts below.'
  );
  const [supportContacts, setSupportContacts] = useState<SupportContact[]>(
    initialData.support?.contacts ?? [
      { name: 'Ashish Kumar Rai', email: 'ashish.rai@ip-house.com' },
      { name: 'IT Support', email: 'itsupport@ip-house.com' },
    ]
  );
  const [supportFooter, setSupportFooter] = useState(
    initialData.support?.footerNote ?? 'Alternatively, you may reach out to your designated Project Manager.'
  );

  // Authorization
  const [authDesc, setAuthDesc] = useState(
    initialData.authorization?.description ?? 'Insert the successfully-generated token to access the API. Use Bearer authentication for all subsequent API calls.'
  );
  const [authHeaderNote, setAuthHeaderNote] = useState(
    initialData.authorization?.headerNote ?? 'In Postman, select Bearer Token in the Authorization tab. Or add the header manually:'
  );
  const [authTokenExample, setAuthTokenExample] = useState(
    initialData.authorization?.tokenExample ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  );

  function addContact() {
    setSupportContacts((c) => [...c, { name: '', email: '' }]);
  }

  function updateContact(i: number, field: keyof SupportContact, val: string) {
    setSupportContacts((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: val } : c)));
  }

  function removeContact(i: number) {
    setSupportContacts((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addPurposePara() { setIntroPurpose((p) => [...p, '']); }
  function updatePurposePara(i: number, val: string) { setIntroPurpose((p) => p.map((x, idx) => idx === i ? val : x)); }
  function removePurposePara(i: number) { setIntroPurpose((p) => p.filter((_, idx) => idx !== i)); }

  function addOverviewPara() { setIntroOverview((p) => [...p, '']); }
  function updateOverviewPara(i: number, val: string) { setIntroOverview((p) => p.map((x, idx) => idx === i ? val : x)); }
  function removeOverviewPara(i: number) { setIntroOverview((p) => p.filter((_, idx) => idx !== i)); }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);

    const payload: ContentData = {
      ...initialData,
      sectionTitles,
      introduction: {
        bannerText: introBanner,
        purpose: introPurpose,
        overview: introOverview,
      },
      login: {
        description: loginDesc,
        baseUrl: loginBaseUrl,
        loginPath,
        tokenExample: loginTokenExample,
        errorWrongUsername: loginErrUsername,
        errorWrongPassword: loginErrPassword,
      },
      support: {
        description: supportDesc,
        contacts: supportContacts,
        footerNote: supportFooter,
      },
      authorization: {
        description: authDesc,
        headerNote: authHeaderNote,
        tokenExample: authTokenExample,
      },
    };

    const res = await fetch('/api/admin/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError('Failed to save.');
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'titles', label: 'Section Titles' },
    { id: 'introduction', label: 'Introduction' },
    { id: 'login', label: 'Login' },
    { id: 'authorization', label: 'Authorization' },
    { id: 'support', label: 'Support' },
  ];

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/dashboard" className="text-[13px] text-[#606770] hover:text-[#1877f2]">
          ← Dashboard
        </Link>
        <span className="text-[#dadde1]">/</span>
        <span className="text-[13px] text-[#1c1e21] font-medium">Sections & Text</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1c1e21]">Sections & Text</h1>
          <p className="text-[13px] text-[#606770] mt-0.5">Edit section titles, descriptions, contacts, and body text.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-[13px] text-[#22c55e] font-medium flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
          {error && <span className="text-[13px] text-[#ef4444]">{error}</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-[#1877f2] hover:bg-[#166fe5] text-white text-[13.5px] font-semibold rounded-md transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-white border border-[#dadde1] rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[#1877f2] text-white'
                : 'text-[#606770] hover:text-[#1c1e21]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section Titles Tab */}
      {activeTab === 'titles' && (
        <div className="bg-white rounded-xl border border-[#dadde1] p-6">
          <h2 className="text-[15px] font-bold text-[#1c1e21] mb-1">Navigation Section Titles</h2>
          <p className="text-[13px] text-[#606770] mb-5">These titles appear in the sidebar and as page headings.</p>
          <div className="space-y-3">
            {SECTION_TITLE_KEYS.map((s) => (
              <div key={s.id} className="grid grid-cols-3 gap-4 items-center">
                <label className="text-[13px] text-[#606770]">{s.label}</label>
                <div className="col-span-2">
                  <input
                    value={sectionTitles[s.id] ?? s.default}
                    onChange={(e) =>
                      setSectionTitles((prev) => ({ ...prev, [s.id]: e.target.value }))
                    }
                    placeholder={s.default}
                    className="w-full px-3 py-2 text-[13.5px] border border-[#dadde1] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1877f2]/30 focus:border-[#1877f2]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Introduction Tab */}
      {activeTab === 'introduction' && (
        <div className="space-y-5">
          <section className="bg-white rounded-xl border border-[#dadde1] p-6">
            <h2 className="text-[15px] font-bold text-[#1c1e21] mb-4">Banner Text</h2>
            <textarea
              value={introBanner}
              onChange={(e) => setIntroBanner(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-[14px] border border-[#dadde1] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1877f2]/30 focus:border-[#1877f2] resize-none"
            />
          </section>

          <section className="bg-white rounded-xl border border-[#dadde1] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold text-[#1c1e21]">Purpose — Paragraphs</h2>
                <p className="text-[12px] text-[#606770] mt-0.5">Each paragraph appears under the "Purpose" heading.</p>
              </div>
              <button onClick={addPurposePara} className="text-[12px] text-[#1877f2] border border-[#1877f2]/30 px-3 py-1.5 rounded-md hover:bg-[#1877f2]/5">
                + Add Paragraph
              </button>
            </div>
            <div className="space-y-3">
              {introPurpose.map((para, i) => (
                <div key={i} className="flex gap-2">
                  <textarea
                    value={para}
                    onChange={(e) => updatePurposePara(i, e.target.value)}
                    rows={3}
                    className="flex-1 px-3 py-2 text-[13.5px] border border-[#dadde1] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1877f2]/30 focus:border-[#1877f2] resize-none"
                  />
                  <button onClick={() => removePurposePara(i)} className="p-1.5 text-[#606770] hover:text-[#ef4444] self-start mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-[#dadde1] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold text-[#1c1e21]">Platform Overview — Paragraphs</h2>
                <p className="text-[12px] text-[#606770] mt-0.5">Each paragraph appears under the "Platform Overview" heading.</p>
              </div>
              <button onClick={addOverviewPara} className="text-[12px] text-[#1877f2] border border-[#1877f2]/30 px-3 py-1.5 rounded-md hover:bg-[#1877f2]/5">
                + Add Paragraph
              </button>
            </div>
            <div className="space-y-3">
              {introOverview.map((para, i) => (
                <div key={i} className="flex gap-2">
                  <textarea
                    value={para}
                    onChange={(e) => updateOverviewPara(i, e.target.value)}
                    rows={3}
                    className="flex-1 px-3 py-2 text-[13.5px] border border-[#dadde1] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1877f2]/30 focus:border-[#1877f2] resize-none"
                  />
                  <button onClick={() => removeOverviewPara(i)} className="p-1.5 text-[#606770] hover:text-[#ef4444] self-start mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Login Tab */}
      {activeTab === 'login' && (
        <div className="space-y-5">
          <section className="bg-white rounded-xl border border-[#dadde1] p-6">
            <h2 className="text-[15px] font-bold text-[#1c1e21] mb-4">Login Section</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#606770] uppercase tracking-wide mb-1">Description</label>
                <textarea value={loginDesc} onChange={(e) => setLoginDesc(e.target.value)} rows={2}
                  className="w-full px-3 py-2 text-[13.5px] border border-[#dadde1] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1877f2]/30 focus:border-[#1877f2] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#606770] uppercase tracking-wide mb-1">Base URL</label>
                  <input value={loginBaseUrl} onChange={(e) => setLoginBaseUrl(e.target.value)}
                    className="w-full px-3 py-2 text-[13.5px] font-mono border border-[#dadde1] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1877f2]/30 focus:border-[#1877f2]" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#606770] uppercase tracking-wide mb-1">Login Path</label>
                  <input value={loginPath} onChange={(e) => setLoginPath(e.target.value)}
                    className="w-full px-3 py-2 text-[13.5px] font-mono border border-[#dadde1] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1877f2]/30 focus:border-[#1877f2]" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#606770] uppercase tracking-wide mb-1">Token Example (Success 200 response)</label>
                <textarea value={loginTokenExample} onChange={(e) => setLoginTokenExample(e.target.value)} rows={2}
                  className="w-full px-3 py-2 text-[13px] font-mono border border-[#dadde1] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1877f2]/30 focus:border-[#1877f2] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#606770] uppercase tracking-wide mb-1">Error — Wrong Username (400)</label>
                  <input value={loginErrUsername} onChange={(e) => setLoginErrUsername(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] font-mono border border-[#dadde1] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1877f2]/30 focus:border-[#1877f2]" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#606770] uppercase tracking-wide mb-1">Error — Wrong Password (400)</label>
                  <input value={loginErrPassword} onChange={(e) => setLoginErrPassword(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] font-mono border border-[#dadde1] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1877f2]/30 focus:border-[#1877f2]" />
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Authorization Tab */}
      {activeTab === 'authorization' && (
        <section className="bg-white rounded-xl border border-[#dadde1] p-6">
          <h2 className="text-[15px] font-bold text-[#1c1e21] mb-4">Authorization Section</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#606770] uppercase tracking-wide mb-1">Intro Description</label>
              <textarea value={authDesc} onChange={(e) => setAuthDesc(e.target.value)} rows={2}
                className="w-full px-3 py-2 text-[13.5px] border border-[#dadde1] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1877f2]/30 focus:border-[#1877f2] resize-none" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#606770] uppercase tracking-wide mb-1">Header Note</label>
              <textarea value={authHeaderNote} onChange={(e) => setAuthHeaderNote(e.target.value)} rows={2}
                className="w-full px-3 py-2 text-[13.5px] border border-[#dadde1] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1877f2]/30 focus:border-[#1877f2] resize-none" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#606770] uppercase tracking-wide mb-1">Token Example</label>
              <input value={authTokenExample} onChange={(e) => setAuthTokenExample(e.target.value)}
                className="w-full px-3 py-2 text-[13px] font-mono border border-[#dadde1] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1877f2]/30 focus:border-[#1877f2]" />
            </div>
          </div>
        </section>
      )}

      {/* Support Tab */}
      {activeTab === 'support' && (
        <div className="space-y-5">
          <section className="bg-white rounded-xl border border-[#dadde1] p-6">
            <h2 className="text-[15px] font-bold text-[#1c1e21] mb-4">Support Section</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#606770] uppercase tracking-wide mb-1">Description</label>
                <textarea value={supportDesc} onChange={(e) => setSupportDesc(e.target.value)} rows={2}
                  className="w-full px-3 py-2 text-[13.5px] border border-[#dadde1] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1877f2]/30 focus:border-[#1877f2] resize-none" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#606770] uppercase tracking-wide mb-1">Footer Note</label>
                <input value={supportFooter} onChange={(e) => setSupportFooter(e.target.value)}
                  className="w-full px-3 py-2 text-[13.5px] border border-[#dadde1] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1877f2]/30 focus:border-[#1877f2]" />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-[#dadde1] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold text-[#1c1e21]">Support Contacts</h2>
                <p className="text-[12px] text-[#606770] mt-0.5">Names and email addresses shown on the Support page.</p>
              </div>
              <button onClick={addContact}
                className="text-[12px] text-[#1877f2] border border-[#1877f2]/30 px-3 py-1.5 rounded-md hover:bg-[#1877f2]/5">
                + Add Contact
              </button>
            </div>
            <div className="space-y-3">
              {supportContacts.map((c, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <input
                    placeholder="Full Name"
                    value={c.name}
                    onChange={(e) => updateContact(i, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 text-[13.5px] border border-[#dadde1] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1877f2]/30 focus:border-[#1877f2]"
                  />
                  <input
                    placeholder="email@example.com"
                    value={c.email}
                    onChange={(e) => updateContact(i, 'email', e.target.value)}
                    className="flex-1 px-3 py-2 text-[13.5px] font-mono border border-[#dadde1] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1877f2]/30 focus:border-[#1877f2]"
                  />
                  <button onClick={() => removeContact(i)} className="p-1.5 text-[#606770] hover:text-[#ef4444]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <div className="flex justify-end pt-4 pb-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[#1877f2] hover:bg-[#166fe5] text-white text-[14px] font-semibold rounded-md transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save All Changes'}
        </button>
      </div>
    </>
  );
}
