import { CodeBlock } from './CodeBlock';
import { MethodBadge } from './MethodBadge';
import { ParamsTable } from './ParamsTable';
import type { Endpoint } from '@/data/types';

export function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const headerLines: string[] = [];
  if (endpoint.headers) {
    Object.entries(endpoint.headers).forEach(([k, v]) => {
      headerLines.push(`${k}: ${v}`);
    });
  }

  return (
    <div className="my-6">
      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <MethodBadge method={endpoint.method} />
        <code className="font-mono text-[13.5px] font-semibold text-[var(--color-fg)]">
          {`{{base_url}}${endpoint.path}`}
        </code>
      </div>

      {endpoint.description && (
        <p className="mb-4 text-[var(--color-fg)]">{endpoint.description}</p>
      )}

      {headerLines.length > 0 && (
        <>
          <h4 className="mt-5 mb-1 text-[14px] font-semibold text-[var(--color-fg)]">Headers</h4>
          <CodeBlock code={headerLines.join('\n')} language="http" />
        </>
      )}

      {endpoint.requestBody && (
        <>
          <h4 className="mt-5 mb-1 text-[14px] font-semibold text-[var(--color-fg)]">
            Request Body
          </h4>
          <CodeBlock code={endpoint.requestBody} language="json" />
        </>
      )}

      {endpoint.parameters && endpoint.parameters.length > 0 && (
        <>
          <h4 className="mt-5 mb-1 text-[14px] font-semibold text-[var(--color-fg)]">
            Parameters
          </h4>
          <ParamsTable parameters={endpoint.parameters} />
        </>
      )}

      {endpoint.responses.map((r) => (
        <div key={`${r.status}-${r.label}`}>
          <h4 className="mt-5 mb-1 text-[14px] font-semibold text-[var(--color-fg)]">
            Response — {r.label} ({r.status})
          </h4>
          <CodeBlock code={r.body} language="json" />
        </div>
      ))}
    </div>
  );
}
