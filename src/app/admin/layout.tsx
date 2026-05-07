export const dynamic = 'force-dynamic';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminNav } from './AdminNav';
import { PageViewLogger } from './PageViewLogger';
import { getAuthContextFromCookieHeader } from '@/lib/session';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContextFromCookieHeader(headers().get('cookie') ?? '');
  if (!ctx) redirect('/login');
  if (ctx.user.role !== 'admin') redirect('/docs/introduction');

  return (
    <AdminNav>
      <PageViewLogger />
      {children}
    </AdminNav>
  );
}
