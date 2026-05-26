import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/session';
import { getPlaygroundStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const all = searchParams.get('all') === 'true' && ctx.user.role === 'admin';

  const stats = all ? getPlaygroundStats() : getPlaygroundStats(ctx.user.id);
  return NextResponse.json({ stats });
}
