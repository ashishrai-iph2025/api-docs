import { NextRequest, NextResponse } from 'next/server';
import {
  getUserByEmail,
  getValidOtp,
  incrementOtpAttempt,
  markOtpUsed,
  createSession,
  updateLastLogin,
  logActivity,
} from '@/lib/db';
import {
  makeSignedCookie,
  SESSION_COOKIE,
  CSRF_COOKIE,
  sessionCookieOptions,
  csrfCookieOptions,
} from '@/lib/session';

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || '127.0.0.1';
}

export async function POST(req: NextRequest) {
  let email: string, code: string;
  try {
    const body = await req.json();
    email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : '';
    code  = typeof body?.code  === 'string' ? body.code.trim() : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!email || !code) {
    return NextResponse.json({ error: 'Email and code are required.' }, { status: 400 });
  }

  const ip = getIp(req);
  const ua = req.headers.get('user-agent') ?? undefined;

  const user = getUserByEmail(email);
  if (!user || !user.is_active) {
    return NextResponse.json({ error: 'Invalid email or code.' }, { status: 401 });
  }

  const otp = getValidOtp(email);
  if (!otp) {
    return NextResponse.json(
      { error: 'No valid code found. Please request a new one.' },
      { status: 401 },
    );
  }

  // Constant-time comparison
  const provided = Buffer.from(code.padEnd(6), 'utf8');
  const expected = Buffer.from(otp.code.padEnd(6), 'utf8');
  const match = provided.length === expected.length &&
    require('crypto').timingSafeEqual(provided, expected);

  if (!match) {
    incrementOtpAttempt(otp.id);
    logActivity({ user_id: user.id, email, action: 'otp_failed', ip_address: ip, user_agent: ua });
    return NextResponse.json({ error: 'Invalid code. Please try again.' }, { status: 401 });
  }

  markOtpUsed(otp.id);
  updateLastLogin(user.id);

  const session = createSession(user.id, ip, ua);

  logActivity({
    user_id: user.id,
    email,
    action: 'login',
    details: { role: user.role },
    ip_address: ip,
    user_agent: ua,
  });

  const signed = makeSignedCookie(session.id, user.role);
  const res = NextResponse.json({ ok: true, role: user.role });

  res.cookies.set(SESSION_COOKIE, signed, sessionCookieOptions());
  res.cookies.set(CSRF_COOKIE, session.csrf_token, csrfCookieOptions());

  return res;
}
