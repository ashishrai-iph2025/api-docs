import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createSession, updateLastLogin, logActivity } from '@/lib/db';
import { makeSignedCookie, SESSION_COOKIE, CSRF_COOKIE, sessionCookieOptions, csrfCookieOptions } from '@/lib/session';

export async function POST(req: NextRequest) {
  let email: string;
  try {
    const body = await req.json();
    email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const ua = req.headers.get('user-agent') ?? undefined;

  const user = getUserByEmail(email);

  // Only allow if user exists, is active, and has otp_enabled = 0
  if (!user || !user.is_active || user.otp_enabled !== 0) {
    return NextResponse.json({ error: 'Direct login not permitted.' }, { status: 403 });
  }

  updateLastLogin(user.id);
  const session = createSession(user.id, ip, ua);

  logActivity({ user_id: user.id, email, action: 'login', details: { role: user.role, method: 'direct' }, ip_address: ip, user_agent: ua });

  const signed = makeSignedCookie(session.id, user.role);
  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set(SESSION_COOKIE, signed, sessionCookieOptions());
  res.cookies.set(CSRF_COOKIE, session.csrf_token, csrfCookieOptions());
  return res;
}
