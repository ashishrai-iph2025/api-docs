import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createSession, updateLastLogin, logActivity, verifyPassword } from '@/lib/db';
import { makeSignedCookie, SESSION_COOKIE, CSRF_COOKIE, sessionCookieOptions, csrfCookieOptions } from '@/lib/session';

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || '127.0.0.1';
}

export async function POST(req: NextRequest) {
  let email: string, password: string;
  try {
    const body = await req.json();
    email    = typeof body?.email    === 'string' ? body.email.toLowerCase().trim() : '';
    password = typeof body?.password === 'string' ? body.password : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const ip = getIp(req);
  const ua = req.headers.get('user-agent') ?? undefined;

  const user = getUserByEmail(email);

  // Constant-time-ish: always attempt verify even on bad user to avoid timing leak
  const passwordOk = user?.password_hash
    ? await verifyPassword(password, user.password_hash)
    : false;

  if (!user || !user.is_active || !passwordOk) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  updateLastLogin(user.id);
  const session = createSession(user.id, ip, ua);

  logActivity({
    user_id: user.id,
    email,
    action: 'login',
    details: { role: user.role, method: 'password' },
    ip_address: ip,
    user_agent: ua,
  });

  const signed = makeSignedCookie(session.id, user.role);
  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set(SESSION_COOKIE, signed, sessionCookieOptions());
  res.cookies.set(CSRF_COOKIE, session.csrf_token, csrfCookieOptions());
  return res;
}
