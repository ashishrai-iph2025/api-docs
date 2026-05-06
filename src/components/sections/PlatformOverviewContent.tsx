import Link from 'next/link';
import { MethodBadge } from '@/components/MethodBadge';
import type { Endpoint } from '@/data/types';

interface Props {
  endpoints: Endpoint[];
}

export function PlatformOverviewContent({ endpoints }: Props) {
  return (
    <>
      <p className="mb-4">
        The API exposes a <strong>single unified endpoint</strong> that aggregates infringements
        across every platform, plus dedicated <strong>platform-specific endpoints</strong> for
        when you need finer-grained data.
      </p>

      <h2
        id="all-platforms"
        className="anchor-target mt-8 mb-3 text-[22px] font-bold tracking-tight"
      >
        4.1 Single Endpoint for All Platforms
      </h2>
      <p className="mb-3">
        Use this endpoint to retrieve infringements from open web, UGC, and social-media
        sources in a single request.
      </p>
      {endpoints
        .filter((e) => e.id === 'all-platforms')
        .map((e) => (
          <div key={e.id} className="my-3">
            <Link
              href={`/docs/endpoints/${e.id}`}
              className="inline-flex items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 hover:border-[var(--color-brand)] transition-colors"
            >
              <MethodBadge method={e.method} />
              <code className="font-mono text-[13.5px] font-semibold">{e.path}</code>
            </Link>
          </div>
        ))}

      <h2
        id="platform-endpoints"
        className="anchor-target mt-10 mb-3 text-[22px] font-bold tracking-tight"
      >
        4.2 Platform-wise Endpoints
      </h2>
      <p className="mb-4">
        Retrieve platform-specific infringement data using the endpoints below. Each endpoint
        returns a payload tailored to that platform.
      </p>

      <div className="my-4 grid gap-2">
        {endpoints
          .filter((e) => e.id !== 'all-platforms')
          .map((e) => (
            <Link
              key={e.id}
              href={`/docs/endpoints/${e.id}`}
              className="flex flex-wrap items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 hover:border-[var(--color-brand)] hover:bg-[var(--color-surface)] transition-colors"
            >
              <MethodBadge method={e.method} />
              <code className="font-mono text-[13px] font-medium text-[var(--color-fg)]">
                {e.path}
              </code>
              <span className="ml-auto text-[13px] text-[var(--color-fg-muted)]">{e.title}</span>
            </Link>
          ))}
      </div>

      <h2
        id="pagination"
        className="anchor-target mt-10 mb-3 text-[22px] font-bold tracking-tight"
      >
        Pagination
      </h2>

      {/* Callout box */}
      <div className="mb-5 flex gap-3 rounded-lg border border-[var(--color-brand)]/30 bg-[var(--color-brand)]/5 px-4 py-3">
        <svg className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-brand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
        </svg>
        <p className="text-[14px] text-[var(--color-fg)]">
          All endpoints return a maximum of <strong>1,000 records per page</strong>. To retrieve
          more records, increment the <code className="font-mono text-[13px] bg-[var(--color-surface)] px-1 py-0.5 rounded">page</code> parameter
          in subsequent requests.
        </p>
      </div>

      <p className="mb-3 text-[var(--color-fg)]">
        Include the <code className="font-mono text-[13px] bg-[var(--color-surface)] px-1 py-0.5 rounded">page</code> field
        in the request body. Page numbering starts at <strong>1</strong>. If omitted, the API defaults to page 1.
      </p>

      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] mb-3">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <th className="px-4 py-2 text-left font-semibold text-[var(--color-fg-muted)]">Page</th>
              <th className="px-4 py-2 text-left font-semibold text-[var(--color-fg-muted)]">Records returned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {[
              ['1 (default)', 'Rows 1 – 1,000'],
              ['2', 'Rows 1,001 – 2,000'],
              ['3', 'Rows 2,001 – 3,000'],
              ['n', 'Rows ((n−1) × 1,000 + 1) – (n × 1,000)'],
            ].map(([page, records]) => (
              <tr key={page}>
                <td className="px-4 py-2 font-mono text-[var(--color-fg)]">{page}</td>
                <td className="px-4 py-2 text-[var(--color-fg-muted)]">{records}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mb-3 text-[14px] text-[var(--color-fg-muted)]">
        Example — fetching the second page of results:
      </p>
      <pre className="mb-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 font-mono text-[13px] text-[var(--color-fg)] overflow-x-auto">
{`{
  "startdate": "2025-01-01T00:00:00.000Z",
  "enddate":   "2025-01-31T23:59:59.999Z",
  "assetname": "My Movie",
  "page": 2
}`}
      </pre>

      <h2
        id="common-format"
        className="anchor-target mt-10 mb-3 text-[22px] font-bold tracking-tight"
      >
        Common Request Format
      </h2>
      <p className="mb-3">
        Every endpoint listed above shares the same request format — the same headers,
        body schema, and parameters. Only the response payload changes per platform.
      </p>
    </>
  );
}
