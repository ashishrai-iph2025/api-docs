import { BodySchemaPanel } from './BodySchemaPanel';
import { CodeBlock } from './CodeBlock';
import { MethodBadge } from './MethodBadge';
import { ParamsTable } from './ParamsTable';
import type { Endpoint } from '@/data/types';

/** Swagger-style status colouring: 2xx success, 3xx info, 4xx warning, 5xx error. */
function statusColor(status: number): string {
  if (status >= 200 && status < 300) return 'var(--color-success)';
  if (status >= 300 && status < 400) return 'var(--color-brand)';
  if (status >= 400 && status < 500) return 'var(--color-warning)';
  return 'var(--color-error)';
}

/** Single active tab strip, mirroring Swagger UI's "Example Value" tab. */
function ExampleTab() {
  return (
    <div className="flex items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4">
      <span className="-mb-px border-b-2 border-[var(--color-brand)] py-2 text-[12px] font-semibold text-[var(--color-fg)]">
        Example Value
      </span>
    </div>
  );
}

function MediaType({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 font-mono text-[12px] text-[var(--color-fg-muted)]">
      {label}
    </span>
  );
}

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
        <section className="mt-6">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-[15px] font-semibold text-[var(--color-fg)]">Request body</h4>
            <MediaType label="application/json" />
          </div>
          <BodySchemaPanel example={endpoint.requestBody} fields={endpoint.parameters} />
        </section>
      )}

      {endpoint.parameters && endpoint.parameters.length > 0 && (
        <>
          <h4 className="mt-5 mb-1 text-[14px] font-semibold text-[var(--color-fg)]">
            Parameters
          </h4>
          <ParamsTable parameters={endpoint.parameters} />
        </>
      )}

      {endpoint.responses.length > 0 && (
        <section className="mt-6">
          <h4 className="mb-2 text-[15px] font-semibold text-[var(--color-fg)]">Responses</h4>
          <div className="overflow-hidden rounded-md border border-[var(--color-border)]">
            <table className="w-full table-fixed text-[14px]">
              <thead className="bg-[var(--color-surface)]">
                <tr>
                  <th className="w-[92px] border-b border-[var(--color-border)] px-4 py-2.5 text-left font-semibold text-[var(--color-fg)]">
                    Code
                  </th>
                  <th className="border-b border-[var(--color-border)] px-4 py-2.5 text-left font-semibold text-[var(--color-fg)]">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {endpoint.responses.map((r, idx) => (
                  <tr
                    key={`${r.status}-${r.label}`}
                    className={
                      idx !== endpoint.responses.length - 1
                        ? 'border-b border-[var(--color-border)]'
                        : ''
                    }
                  >
                    <td
                      className="px-4 py-4 align-top font-mono text-[13px] font-bold"
                      style={{ color: statusColor(r.status) }}
                    >
                      {r.status}
                    </td>
                    <td className="min-w-0 px-4 py-4 align-top">
                      <p className="mb-3 text-[var(--color-fg)]">{r.label}</p>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="text-[12px] text-[var(--color-fg-muted)]">Media type</span>
                        <MediaType label="application/json" />
                      </div>
                      <div className="overflow-hidden rounded-md border border-[var(--color-border)]">
                        <ExampleTab />
                        <CodeBlock code={r.body} language="json" embedded />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
