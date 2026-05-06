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
    <div className="min-h-screen bg-white">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden border-b border-[#dadde1]">
        {/* Background grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#1877f2 1px, transparent 1px), linear-gradient(90deg, #1877f2 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Gradient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#1877f2] opacity-[0.06] rounded-full blur-[120px]" />

        <div className="relative mx-auto max-w-6xl px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#dadde1] bg-[#f5f6f7] px-4 py-1.5 text-[12.5px] font-medium text-[#606770] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            API v1.0 · REST · Bearer Auth
          </div>

          <h1 className="text-[52px] leading-[1.1] font-bold tracking-tight text-[#1c1e21] mb-5">
            MediaScan
            <span className="text-[#1877f2]"> Developer</span>
            <br />
            <span className="text-[#606770]">API Platform</span>
          </h1>

          <p className="max-w-2xl mx-auto text-[17px] text-[#606770] leading-relaxed mb-10">
            Programmatic access to IP infringement intelligence across social media, video platforms,
            app stores, UGC sites, and the open web. Built for rights holders and anti-piracy teams.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/docs/introduction"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1877f2] hover:bg-[#166fe5] text-white text-[15px] font-semibold rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Read the Docs
            </Link>
            <Link
              href="/docs/endpoints"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[#dadde1] bg-white hover:bg-[#f5f6f7] text-[#1c1e21] text-[15px] font-semibold rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Explore Endpoints
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-3 md:grid-cols-3 gap-px bg-[#dadde1] border border-[#dadde1] rounded-xl overflow-hidden max-w-lg mx-auto">
            {[
              { value: `${endpoints.length}`, label: 'Endpoints' },
              { value: '11+', label: 'Platforms' },
              { value: '40+', label: 'Response Fields' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white px-6 py-5">
                <div className="text-[26px] font-bold text-[#1877f2]">{stat.value}</div>
                <div className="text-[12px] text-[#606770] font-medium mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 px-6 border-b border-[#dadde1]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-[30px] font-bold text-[#1c1e21]">Everything you need to monitor IP</h2>
            <p className="text-[15px] text-[#606770] mt-2">
              A comprehensive API designed for anti-piracy workflows from day one.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative p-6 rounded-xl border border-[#dadde1] bg-white hover:border-[#1877f2]/40 hover:shadow-sm transition-all"
              >
                <div
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4"
                  style={{ backgroundColor: `${f.color}12`, color: f.color }}
                >
                  {f.icon}
                </div>
                <h3 className="text-[15px] font-bold text-[#1c1e21] mb-2">{f.title}</h3>
                <p className="text-[13.5px] text-[#606770] leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORMS ── */}
      <section className="py-16 px-6 bg-[#f5f6f7] border-b border-[#dadde1]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-[26px] font-bold text-[#1c1e21]">Platforms Covered</h2>
            <p className="text-[14px] text-[#606770] mt-1.5">
              Dedicated endpoints for each platform with platform-specific response schemas.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {platforms.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-full border border-[#dadde1] hover:border-[#c4c8cd] transition-colors"
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                  style={{ backgroundColor: p.color }}
                >
                  {p.icon}
                </div>
                <span className="text-[13px] font-medium text-[#1c1e21]">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUICK START ── */}
      <section className="py-20 px-6 border-b border-[#dadde1]">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Steps */}
            <div>
              <div className="text-[12px] font-bold uppercase tracking-widest text-[#1877f2] mb-3">Quick Start</div>
              <h2 className="text-[28px] font-bold text-[#1c1e21] mb-2">Up and running in 4 steps</h2>
              <p className="text-[14px] text-[#606770] mb-8">
                Integrate the MediaScan API in minutes with your preferred HTTP client.
              </p>
              <div className="space-y-5">
                {quickStartSteps.map((s) => (
                  <div key={s.step} className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-[#1877f2]/10 text-[#1877f2] text-[12px] font-bold flex items-center justify-center">
                      {s.step}
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-[#1c1e21]">{s.title}</div>
                      <div className="text-[13px] text-[#606770] mt-0.5">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/docs/login"
                className="inline-flex items-center gap-2 mt-8 text-[14px] font-semibold text-[#1877f2] hover:underline"
              >
                View full authentication guide →
              </Link>
            </div>

            {/* Code preview */}
            <div className="rounded-xl overflow-hidden border border-[#dadde1] shadow-sm">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#1c1e21] border-b border-white/10">
                <div className="w-3 h-3 rounded-full bg-[#ef4444]/70" />
                <div className="w-3 h-3 rounded-full bg-[#f59e0b]/70" />
                <div className="w-3 h-3 rounded-full bg-[#22c55e]/70" />
                <span className="ml-3 text-[12px] text-white/40 font-mono">example.sh</span>
              </div>
              <div className="bg-[#0d1117] p-5 text-[13px] font-mono leading-7 overflow-x-auto">
                <div className="text-[#6e7781]"># Step 1 — Authenticate</div>
                <div>
                  <span className="text-[#f78166]">curl</span>
                  <span className="text-[#e6edf3]"> -X POST \</span>
                </div>
                <div className="pl-4">
                  <span className="text-[#79c0ff]">https://api.markscan.co.in</span>
                  <span className="text-[#e6edf3]">/Login \</span>
                </div>
                <div className="pl-4">
                  <span className="text-[#e6edf3]">-d </span>
                  <span className="text-[#a5d6ff]">{`'{"username":"u","password":"p"}'`}</span>
                </div>
                <div className="mt-4 text-[#6e7781]"># Step 2 — Fetch infringements</div>
                <div>
                  <span className="text-[#f78166]">curl</span>
                  <span className="text-[#e6edf3]"> -X POST \</span>
                </div>
                <div className="pl-4">
                  <span className="text-[#79c0ff]">https://api.markscan.co.in</span>
                  <span className="text-[#e6edf3]">/getinfringements/YouTube \</span>
                </div>
                <div className="pl-4">
                  <span className="text-[#e6edf3]">-H </span>
                  <span className="text-[#a5d6ff]">"Authorization: Bearer &lt;token&gt;"</span>
                  <span className="text-[#e6edf3]"> \</span>
                </div>
                <div className="pl-4">
                  <span className="text-[#e6edf3]">-d </span>
                  <span className="text-[#a5d6ff]">{`'{"startdate":"2025-01-01T00:00:00Z"}'`}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ENDPOINTS PREVIEW ── */}
      <section className="py-20 px-6 bg-[#f5f6f7] border-b border-[#dadde1]">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-[26px] font-bold text-[#1c1e21]">API Endpoints</h2>
              <p className="text-[14px] text-[#606770] mt-1">
                {endpoints.length} endpoints, all returning structured JSON.
              </p>
            </div>
            <Link href="/docs/endpoints" className="text-[13.5px] font-semibold text-[#1877f2] hover:underline">
              View full reference →
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-[#dadde1] overflow-hidden divide-y divide-[#dadde1]">
            {endpoints.slice(0, 6).map((ep) => (
              <Link
                key={ep.id}
                href={`/docs/endpoints/${ep.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#f5f6f7] transition-colors group"
              >
                <span className="inline-block shrink-0 px-2 py-0.5 rounded text-[11px] font-bold bg-[#2563eb]/10 text-[#2563eb] font-mono">
                  POST
                </span>
                <code className="text-[13px] text-[#606770] font-mono flex-1 min-w-0 truncate">
                  {ep.path}
                </code>
                <span className="text-[13.5px] font-medium text-[#1c1e21] shrink-0 hidden sm:block">
                  {ep.title}
                </span>
                <svg className="w-4 h-4 text-[#dadde1] group-hover:text-[#1877f2] ml-auto shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
            {endpoints.length > 6 && (
              <Link
                href="/docs/endpoints"
                className="flex items-center justify-center gap-2 px-5 py-3.5 text-[13px] font-semibold text-[#1877f2] hover:bg-[#f5f6f7] transition-colors"
              >
                +{endpoints.length - 6} more endpoints →
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-16 px-6 border-b border-[#dadde1]">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[26px] font-bold text-[#1c1e21] mb-3">Ready to start building?</h2>
          <p className="text-[14px] text-[#606770] mb-8">
            Review the authentication flow, explore endpoints, and check the JSON response schema.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/docs/introduction"
              className="px-5 py-2.5 bg-[#1877f2] hover:bg-[#166fe5] text-white text-[14px] font-semibold rounded-lg transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/docs/json-dataset"
              className="px-5 py-2.5 border border-[#dadde1] bg-white hover:bg-[#f5f6f7] text-[#1c1e21] text-[14px] font-semibold rounded-lg transition-colors"
            >
              JSON Reference
            </Link>
            <Link
              href="/docs/support"
              className="px-5 py-2.5 border border-[#dadde1] bg-white hover:bg-[#f5f6f7] text-[#1c1e21] text-[14px] font-semibold rounded-lg transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1877f2] flex items-center justify-center text-white text-[11px] font-bold">
              MS
            </div>
            <span className="text-[13px] font-semibold text-[#1c1e21]">MediaScan</span>
            <span className="text-[12px] text-[#606770]">Developer Platform</span>
          </div>
          <div className="flex items-center gap-6 text-[13px] text-[#606770]">
            <Link href="/docs/introduction" className="hover:text-[#1877f2] transition-colors">Docs</Link>
            <Link href="/docs/endpoints" className="hover:text-[#1877f2] transition-colors">Endpoints</Link>
            <Link href="/docs/support" className="hover:text-[#1877f2] transition-colors">Support</Link>
            <span className="text-[#dadde1]">|</span>
            <Link
              href="/admin/login"
              className="text-[#c4c8cd] hover:text-[#606770] transition-colors text-[12px]"
            >
              Admin
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
