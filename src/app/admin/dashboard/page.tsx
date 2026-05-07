import Link from 'next/link';
import { getEndpoints } from '@/lib/content-store';
import { getUserCount, getRecentActivity, getActivityCount } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ACTION_LABELS: Record<string, string> = {
  login:              'Signed in',
  logout:             'Signed out',
  otp_requested:      'Requested OTP code',
  otp_failed:         'Failed OTP attempt',
  page_view:          'Viewed page',
  user_created:       'Created user',
  user_updated:       'Updated user',
  user_deactivated:   'Deactivated user',
  user_activated:     'Activated user',
  endpoint_updated:   'Updated endpoint',
  endpoint_deleted:   'Deleted endpoint',
  endpoint_enabled:   'Enabled endpoint',
  endpoint_disabled:  'Disabled endpoint',
  endpoint_reordered: 'Reordered endpoints',
  content_updated:    'Updated content',
};

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminDashboard() {
  const endpoints    = getEndpoints();
  const userCount    = getUserCount();
  const recentLogs   = getRecentActivity(10);
  const totalEvents  = getActivityCount({});
  const loginCount   = getActivityCount({ action: 'login' });
  const activeEps    = endpoints.filter(e => e.active !== false).length;

  const statCards = [
    {
      title: 'Total Users',
      value: userCount,
      sub: 'registered accounts',
      href: '/admin/users',
      color: '#7c3aed',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      title: 'Active Endpoints',
      value: activeEps,
      sub: `of ${endpoints.length} total endpoints`,
      href: '/admin/endpoints',
      color: 'var(--color-brand)',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'Total Logins',
      value: loginCount,
      sub: 'all-time sign-in events',
      href: '/admin/activity',
      color: '#0891b2',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
      ),
    },
    {
      title: 'Activity Events',
      value: totalEvents,
      sub: 'total tracked events',
      href: '/admin/activity',
      color: '#d97706',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
  ];

  return (
    <div className="py-6">
      <div className="mb-8">
        <h1 className="text-[24px] font-bold text-[var(--color-fg)]">Dashboard</h1>
        <p className="text-[14px] text-[var(--color-fg-muted)] mt-1">
          Overview of the MediaScan Developer Platform.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => (
          <Link
            key={card.href + card.title}
            href={card.href}
            className="group rounded-xl border border-[var(--color-border)] p-5 hover:border-[var(--color-brand)]/50 hover:shadow-sm transition-all"
            style={{ background: 'var(--color-card)' }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
              style={{ backgroundColor: `color-mix(in srgb, ${card.color} 12%, transparent)`, color: card.color }}
            >
              {card.icon}
            </div>
            <div className="text-[28px] font-bold text-[var(--color-fg)] leading-none mb-1">{card.value}</div>
            <div className="text-[13px] font-medium text-[var(--color-fg)] group-hover:text-[var(--color-brand)] transition-colors">{card.title}</div>
            <div className="text-[11px] text-[var(--color-fg-muted)] mt-0.5">{card.sub}</div>
          </Link>
        ))}
      </div>

      {/* Quick-action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            title: 'Manage Users',
            desc: 'Create, edit, activate or deactivate user accounts.',
            href: '/admin/users',
            cta: 'Go to Users',
          },
          {
            title: 'Activity Log',
            desc: 'View all logins, page views, and content changes.',
            href: '/admin/activity',
            cta: 'View Activity',
          },
          {
            title: 'Edit Content',
            desc: 'Update API endpoint details and documentation sections.',
            href: '/admin/sections',
            cta: 'Edit Content',
          },
        ].map(q => (
          <div key={q.href} className="rounded-xl border border-[var(--color-border)] p-5" style={{ background: 'var(--color-card)' }}>
            <h3 className="text-[14px] font-bold text-[var(--color-fg)] mb-1">{q.title}</h3>
            <p className="text-[12.5px] text-[var(--color-fg-muted)] mb-4 leading-relaxed">{q.desc}</p>
            <Link
              href={q.href}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-brand)] hover:underline"
            >
              {q.cta}
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-[var(--color-border)] overflow-hidden" style={{ background: 'var(--color-card)' }}>
        <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[var(--color-fg)]">Recent Activity</h2>
          <Link href="/admin/activity" className="text-[13px] text-[var(--color-brand)] hover:underline font-medium">
            View all →
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <div className="px-6 py-10 text-center text-[13px] text-[var(--color-fg-muted)]">
            No activity recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {recentLogs.map(log => (
              <div key={log.id} className="flex items-start gap-3 px-6 py-3.5 hover:bg-[var(--color-surface)] transition-colors">
                <div className="w-7 h-7 rounded-full bg-[var(--color-brand)]/10 flex items-center justify-center text-[11px] font-bold text-[var(--color-brand)] shrink-0 mt-0.5">
                  {log.email?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[13px] font-medium text-[var(--color-fg)] truncate">
                      {log.email || 'System'}
                    </span>
                    <span className="text-[11px] text-[var(--color-fg-muted)] shrink-0 tabular-nums">
                      {fmtRelative(log.created_at)}
                    </span>
                  </div>
                  <span className="text-[12px] text-[var(--color-fg-muted)]">
                    {ACTION_LABELS[log.action] ?? log.action}
                    {log.resource && log.action === 'page_view' && (
                      <span className="ml-1 font-mono text-[11px]">{log.resource}</span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
