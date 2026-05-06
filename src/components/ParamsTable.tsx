import type { Parameter } from '@/data/types';

export function ParamsTable({ parameters }: { parameters: Parameter[] }) {
  return (
    <div className="my-4 overflow-hidden rounded-md border border-[var(--color-border)]">
      <table className="w-full text-[14px]">
        <thead className="bg-[var(--color-surface)]">
          <tr>
            <th className="border-b border-[var(--color-border)] px-4 py-2.5 text-left font-semibold">
              Parameter
            </th>
            <th className="border-b border-[var(--color-border)] px-4 py-2.5 text-left font-semibold">
              Type
            </th>
            <th className="border-b border-[var(--color-border)] px-4 py-2.5 text-left font-semibold">
              Required
            </th>
            <th className="border-b border-[var(--color-border)] px-4 py-2.5 text-left font-semibold">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((p, idx) => (
            <tr
              key={p.name}
              className={idx !== parameters.length - 1 ? 'border-b border-[var(--color-border)]' : ''}
            >
              <td className="px-4 py-2.5 align-top">
                <code className="rounded bg-[var(--color-code-bg)] px-1.5 py-0.5 text-[13px] text-[var(--color-fg)]">
                  {p.name}
                </code>
              </td>
              <td className="px-4 py-2.5 align-top text-[var(--color-fg-muted)]">{p.type}</td>
              <td className="px-4 py-2.5 align-top">
                {p.required ? (
                  <span className="text-red-600 font-medium">Yes</span>
                ) : (
                  <span className="text-[var(--color-fg-muted)]">No</span>
                )}
              </td>
              <td className="px-4 py-2.5 align-top text-[var(--color-fg)]">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
