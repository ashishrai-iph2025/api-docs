import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/session';
import { getAllPlaygroundTokens, getPlaygroundTokens } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
  const offset = parseInt(searchParams.get('offset') ?? '0');
  const all = searchParams.get('all') === 'true' && ctx.user.role === 'admin';

  const tokens = all
    ? getAllPlaygroundTokens(limit, offset)
    : getPlaygroundTokens(ctx.user.id, limit, offset);

  return NextResponse.json({ tokens });
}
