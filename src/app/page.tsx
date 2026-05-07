import Link from 'next/link';
import { getActiveEndpoints as getEndpoints } from '@/lib/content-store';

export const dynamic = 'force-dynamic';

const platforms = [
  { name: 'YouTube', color: '#FF0000', icon: 'YT' },
  { name: 'Facebook', color: '#1877F2', icon: 'FB' },
  { name: 'Instagram', color: '#E1306C', icon: 'IG' },
  { name: 'Twitter / X', color: '#000000', icon: 'X' },
  { name: 'Telegram', color: '#2AABEE', icon: 'TG' },
  { name: 'TikTok', color: '#010101', icon: 'TK' },
  { name: 'iTunes', color: '#FC3C44', icon: '' },
  { name: 'Google Play', color: '#01875F', icon: 'GP' },
  { name: 'UGC Platforms', color: '#7C3AED', icon: 'UGC' },
  { name: 'Web / Internet', color: '#0550AE', icon: 'WEB' },
  { name: 'Third Party Apps', color: '#D97706', icon: 'APP' },
];

const features = [
  {
    title: 'Multi-Platform Coverage',
    description: 'Monitor infringements across social media, video platforms, app stores, UGC sites, and the open web — all from a single API.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: '#1877f2',
  },
  {
    title: 'Real-Time Data Access',
    description: 'Retrieve up-to-date infringement data with precise date-range filtering and asset-level granularity for efficient monitoring.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: '#7C3AED',
  },
  {
    title: 'Structured JSON Responses',
    description: 'Every endpoint returns richly structured JSON — view counts, upload dates, removal status, channel info, and 40+ fields per record.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    color: '#0550AE',
  },
  {
    title: 'Bearer Token Auth',
    description: 'Secure, stateless authentication via JWT bearer tokens. Login once, use the token across all platform endpoints.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
    color: '#059669',
  },
  {
    title: 'Single Unified Endpoint',
    description: 'Aggregate data from all platforms in one request, or query platform-specific endpoints for tailored response schemas.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
    color: '#D97706',
  },
  {
    title: 'Rights Holder Ready',
    description: 'Purpose-built for content owners, rights holders, and anti-piracy teams who need programmatic access to piracy intelligence.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: '#DC2626',
  },
];

const quickStartSteps = [
  { step: '01', title: 'Get Credentials', desc: 'Receive your API username and password from your project manager.' },
  { step: '02', title: 'Generate Token', desc: 'POST to /Login with your credentials to receive a JWT bearer token.' },
  { step: '03', title: 'Authorize Requests', desc: 'Include the token as Authorization: Bearer <token> in all API calls.' },
  { step: '04', title: 'Fetch Infringements', desc: 'Query any endpoint with startdate and optional filters to retrieve data.' },
];

export default function HomePage() {
  const endpoints = getEndpoints();

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--color-brand) 1px, transparent 1px), linear-gradient(90deg, var(--color-brand) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[120px] opacity-[0.06]"
          style={{ background: 'var(--color-brand)' }} />

        <div className="relative mx-auto max-w-6xl px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-1.5 text-[12.5px] font-medium mb-8"
            style={{ background: 'var(--color-surface)', color: 'var(--color-fg-muted)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
            API v1.0 · REST · Bearer Auth
          </div>

          <h1 className="text-[52px] leading-[1.1] font-bold tracking-tight mb-5" style={{ color: 'var(--color-fg)' }}>
            MediaScan
            <span style={{ color: 'var(--color-brand)' }}> Developer</span>
            <br />
            <span style={{ color: 'var(--color-fg-muted)' }}>API Platform</span>
          </h1>

          <p className="max-w-2xl mx-auto text-[17px] leading-relaxed mb-10" style={{ color: 'var(--color-fg-muted)' }}>
            Programmatic access to IP infringement intelligence across social media, video platforms,
            app stores, UGC sites, and the open web. Built for rights holders and anti-piracy teams.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/docs/introduction"
              className="inline-flex items-center gap-2 px-6 py-3 text-white text-[15px] font-semibold rounded-lg transition-colors shadow-sm"
              style={{ background: 'var(--color-brand)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Read the Docs
            </Link>
            <Link
              href="/docs/endpoints"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[var(--color-border)] text-[15px] font-semibold rounded-lg transition-colors"
              style={{ background: 'var(--color-card)', color: 'var(--color-fg)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Explore Endpoints
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-3 gap-px border border-[var(--color-border)] rounded-xl overflow-hidden max-w-lg mx-auto"
            style={{ background: 'var(--color-border)' }}>
            {[
              { value: `${endpoints.length}`, label: 'Endpoints' },
              { value: '11+', label: 'Platforms' },
              { value: '40+', label: 'Response Fields' },
            ].map((stat) => (
              <div key={stat.label} className="px-6 py-5" style={{ background: 'var(--color-card)' }}>
                <div className="text-[26px] font-bold" style={{ color: 'var(--color-brand)' }}>{stat.value}</div>
                <div className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--color-fg-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 px-6 border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-[30px] font-bold" style={{ color: 'var(--color-fg)' }}>Everything you need to monitor IP</h2>
            <p className="text-[15px] mt-2" style={{ color: 'var(--color-fg-muted)' }}>
              A comprehensive API designed for anti-piracy workflows from day one.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative p-6 rounded-xl border border-[var(--color-border)] hover:shadow-sm transition-all"
                style={{ background: 'var(--color-card)' }}
              >
                <div
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4"
                  style={{ backgroundColor: `${f.color}20`, color: f.color }}
                >
                  {f.icon}
                </div>
                <h3 className="text-[15px] font-bold mb-2" style={{ color: 'var(--color-fg)' }}>{f.title}</h3>
                <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--color-fg-muted)' }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORMS ── */}
      <section className="py-16 px-6 border-b border-[var(--color-border)]" style={{ background: 'var(--color-surface)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-[26px] font-bold" style={{ color: 'var(--color-fg)' }}>Platforms Covered</h2>
            <p className="text-[14px] mt-1.5" style={{ color: 'var(--color-fg-muted)' }}>
              Dedicated endpoints for each platform with platform-specific response schemas.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {platforms.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-colors"
                style={{ background: 'var(--color-card)' }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                  style={{ backgroundColor: p.color }}
                >
                  {p.icon}
                </div>
                <span className="text-[13px] font-medium" style={{ color: 'var(--color-fg)' }}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUICK START ── */}
      {/* ── QUICK START + CTA ── */}
      <section className="py-20 px-6 border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Quick Start */}
          <div>
            <div className="text-[12px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-brand)' }}>Quick Start</div>
            <h2 className="text-[28px] font-bold mb-2" style={{ color: 'var(--color-fg)' }}>Up and running in 4 steps</h2>
            <p className="text-[14px] mb-8" style={{ color: 'var(--color-fg-muted)' }}>
              Integrate the API in minutes with your preferred HTTP client.
            </p>
            <div className="space-y-5">
              {quickStartSteps.map((s) => (
                <div key={s.step} className="flex gap-4">
                  <div className="shrink-0 w-8 h-8 rounded-full text-[12px] font-bold flex items-center justify-center"
                    style={{ background: 'var(--color-brand-subtle)', color: 'var(--color-brand)' }}>
                    {s.step}
                  </div>
                  <div>
                    <div className="text-[14px] font-bold" style={{ color: 'var(--color-fg)' }}>{s.title}</div>
                    <div className="text-[13px] mt-0.5" style={{ color: 'var(--color-fg-muted)' }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/docs/login"
              className="inline-flex items-center gap-2 mt-8 text-[14px] font-semibold hover:underline"
              style={{ color: 'var(--color-brand)' }}
            >
              View full authentication guide →
            </Link>
          </div>

          {/* CTA */}
          <div className="rounded-2xl border border-[var(--color-border)] p-10 flex flex-col justify-center"
            style={{ background: 'var(--color-card)' }}>
            <h2 className="text-[24px] font-bold mb-3" style={{ color: 'var(--color-fg)' }}>Ready to start building?</h2>
            <p className="text-[14px] mb-8 leading-relaxed" style={{ color: 'var(--color-fg-muted)' }}>
              Review the authentication flow, explore endpoints, and check the JSON response schema.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/docs/introduction"
                className="px-5 py-2.5 text-white text-[14px] font-semibold rounded-lg transition-colors text-center"
                style={{ background: 'var(--color-brand)' }}
              >
                Get Started
              </Link>
              <Link
                href="/docs/json-dataset"
                className="px-5 py-2.5 border border-[var(--color-border)] text-[14px] font-semibold rounded-lg transition-colors hover:bg-[var(--color-surface)] text-center"
                style={{ background: 'var(--color-surface)', color: 'var(--color-fg)' }}
              >
                JSON Reference
              </Link>
              <Link
                href="/docs/support"
                className="px-5 py-2.5 border border-[var(--color-border)] text-[14px] font-semibold rounded-lg transition-colors hover:bg-[var(--color-surface)] text-center"
                style={{ background: 'var(--color-surface)', color: 'var(--color-fg)' }}
              >
                Contact Support
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold"
              style={{ background: 'var(--color-brand)' }}>
              MS
            </div>
            <span className="text-[13px] font-semibold" style={{ color: 'var(--color-fg)' }}>MediaScan</span>
            <span className="text-[12px]" style={{ color: 'var(--color-fg-muted)' }}>Developer Platform</span>
          </div>
          <div className="flex items-center gap-6 text-[13px]" style={{ color: 'var(--color-fg-muted)' }}>
            <Link href="/docs/introduction" className="hover:text-[var(--color-brand)] transition-colors">Docs</Link>
            <Link href="/docs/endpoints" className="hover:text-[var(--color-brand)] transition-colors">Endpoints</Link>
            <Link href="/docs/support" className="hover:text-[var(--color-brand)] transition-colors">Support</Link>
            <span style={{ color: 'var(--color-border-strong)' }}>|</span>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] font-semibold text-white transition-colors"
              style={{ background: 'var(--color-brand)' }}
            >
              Login
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
