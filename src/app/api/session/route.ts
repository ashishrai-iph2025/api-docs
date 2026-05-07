import { NextRequest, NextResponse } from 'next/server';
import {
  CSRF_COOKIE,
  SESSION_COOKIE,
  csrfCookieOptions,
  getAuthContext,
  sessionCookieOptions,
} from '@/lib/session';

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) {
    const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const expires = new Date(0);
    res.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(0), expires });
    res.cookies.set(CSRF_COOKIE, '', { ...csrfCookieOptions(0), expires });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
    return res;
  }

  const res = NextResponse.json({
    ok: true,
    user: {
      id: ctx.user.id,
      email: ctx.user.email,
      role: ctx.user.role,
    },
  });
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  return res;
}
