export const dynamic = 'force-dynamic';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { getAuthContextFromCookieHeader } from '@/lib/session';

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContextFromCookieHeader(headers().get('cookie') ?? '');
  if (!ctx) redirect('/login');

  return (
    <div className="mx-auto flex max-w-8xl gap-6 px-4 sm:px-6">
      <Sidebar />
      {children}
    </div>
  );
}
