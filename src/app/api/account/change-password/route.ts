import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/session';
import { getUserById, hashPassword, setUserPassword, verifyPassword, logActivity } from '@/lib/db';

export async function POST(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });

  const csrfHeader = req.headers.get('x-csrf-token');
  if (!csrfHeader || csrfHeader !== auth.session.csrf_token) {
    return NextResponse.json({ error: 'Invalid CSRF token.' }, { status: 403 });
  }

  let currentPassword: string, newPassword: string;
  try {
    const body = await req.json();
    currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : '';
    newPassword     = typeof body?.newPassword     === 'string' ? body.newPassword     : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 });
  }

  const user = getUserById(auth.user.id);
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  if (user.password_hash) {
    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password is required.' }, { status: 400 });
    }
    const ok = await verifyPassword(currentPassword, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 403 });
    }
  }

  const hash = await hashPassword(newPassword);
  setUserPassword(user.id, hash);

  logActivity({
    user_id: user.id,
    email: user.email,
    action: 'password_changed',
    ip_address: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
    user_agent: req.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ ok: true });
}
