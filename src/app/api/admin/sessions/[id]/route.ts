import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/session';
import { deleteSession, logActivity } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext(req);
  if (!ctx || ctx.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = params;
  deleteSession(id);

  logActivity({
    user_id: ctx.user.id,
    email: ctx.user.email,
    action: 'session_revoked',
    resource: id,
    details: { revokedBy: ctx.user.email },
    ip_address: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined,
    user_agent: req.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ ok: true });
}
