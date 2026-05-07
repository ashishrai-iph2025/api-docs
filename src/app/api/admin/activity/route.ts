import { NextRequest, NextResponse } from 'next/server';
import { getActivityLogs, getActivityCount } from '@/lib/db';
import { getAuthContext } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (ctx.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const user_id = searchParams.get('user_id') || undefined;
  const action  = searchParams.get('action')  || undefined;
  const limit   = Math.min(parseInt(searchParams.get('limit')  ?? '50', 10), 200);
  const offset  = Math.max(parseInt(searchParams.get('offset') ?? '0',  10), 0);

  const logs  = getActivityLogs({ user_id, action, limit, offset });
  const total = getActivityCount({ user_id, action });

  return NextResponse.json({ logs, total, limit, offset });
}
