import { Info } from 'lucide-react';

export function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-5 flex gap-3 rounded-md border border-[var(--color-brand)]/30 bg-[var(--color-brand-subtle)] px-4 py-3 text-[14px] text-[var(--color-fg)]">
      <Info className="h-5 w-5 shrink-0 text-[var(--color-brand)] mt-0.5" />
      <div>{children}</div>
    </div>
  );
}
