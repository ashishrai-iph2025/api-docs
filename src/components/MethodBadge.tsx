import clsx from 'clsx';
import type { HttpMethod } from '@/data/types';

const methodColors: Record<HttpMethod, string> = {
  GET: 'bg-green-50 text-green-700 border-green-200',
  POST: 'bg-blue-50 text-blue-700 border-blue-200',
  PUT: 'bg-amber-50 text-amber-700 border-amber-200',
  DELETE: 'bg-red-50 text-red-700 border-red-200',
  PATCH: 'bg-purple-50 text-purple-700 border-purple-200',
};

export function MethodBadge({ method }: { method: HttpMethod }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center rounded border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider',
        methodColors[method]
      )}
    >
      {method}
    </span>
  );
}
