import { NextRequest, NextResponse } from 'next/server';
import { deleteSession, logActivity } from '@/lib/db';
import {
  getSessionIdFromRequest,
  getAuthContext,
  SESSION_COOKIE,
  CSRF_COOKIE,
  sessionCookieOptions,
  csrfCookieOptions,
} from '@/lib/session';

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (ctx) {
    logActivity({
      user_id: ctx.user.id,
      email: ctx.user.email,
      action: 'logout',
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
      user_agent: req.headers.get('user-agent') ?? undefined,
    });
    deleteSession(ctx.session.id);
  } else {
    // Session may already be gone; still clear the cookie
    const sessionId = getSessionIdFromRequest(req);
    if (sessionId) deleteSession(sessionId);
  }

  const res = NextResponse.json({ ok: true });

  const expires = new Date(0);
  res.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(0), expires });
  res.cookies.set(CSRF_COOKIE, '', { ...csrfCookieOptions(0), expires });

  // Prevent any caching of the logout response
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  return res;
}
