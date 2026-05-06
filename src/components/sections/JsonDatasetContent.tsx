import { jsonDataset } from '@/data/json-dataset';

export function JsonDatasetContent() {
  return (
    <>
      <p className="mb-4">
        The table below describes every data point that may be returned in API responses.
        Some fields are present only on certain platforms.
      </p>

      <div className="my-4 overflow-hidden rounded-md border border-[var(--color-border)]">
        <table className="w-full text-[14px]">
          <thead className="bg-[var(--color-surface)]">
            <tr>
              <th className="border-b border-[var(--color-border)] px-4 py-2.5 text-left font-semibold w-1/3">
                JSON Data Point
              </th>
              <th className="border-b border-[var(--color-border)] px-4 py-2.5 text-left font-semibold">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {jsonDataset.map((field, idx) => (
              <tr
                key={field.name}
                className={idx !== jsonDataset.length - 1 ? 'border-b border-[var(--color-border)]' : ''}
              >
                <td className="px-4 py-2.5 align-top">
                  <code className="rounded bg-[var(--color-code-bg)] px-1.5 py-0.5 text-[13px] font-medium">
                    {field.name}
                  </code>
                </td>
                <td className="px-4 py-2.5 align-top text-[var(--color-fg)]">{field.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
