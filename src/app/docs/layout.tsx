export const dynamic = 'force-dynamic';

import { Sidebar } from '@/components/Sidebar';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-8xl gap-6 px-4 sm:px-6">
      <Sidebar />
      {children}
    </div>
  );
}
