import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/session';
import { logActivity } from '@/lib/db';

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let pathname: string;
  try {
    const body = await req.json();
    pathname = typeof body?.pathname === 'string' ? body.pathname : '';
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  if (!pathname) return NextResponse.json({ ok: true });

  logActivity({
    user_id: ctx.user.id,
    email: ctx.user.email,
    action: 'page_view',
    resource: pathname,
    ip_address: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
    user_agent: req.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ ok: true });
}
