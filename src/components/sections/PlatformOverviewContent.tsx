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
              className="flex flex-wrap items-center gap-3 rounded-md border border-[var(--color-border)] bg-white px-4 py-3 hover:border-[var(--color-brand)] hover:bg-[var(--color-surface)] transition-colors"
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
