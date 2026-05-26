import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/session';
import { getAllActiveSessions } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx || ctx.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const sessions = getAllActiveSessions();
  return NextResponse.json({ sessions, currentSessionId: ctx.session.id });
}
