import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'session_id';
const CSRF_COOKIE    = 'csrf_token';
const LOGIN_PATH     = '/login';

// ── Edge-compatible HMAC ──────────────────────────────────────────────────────

async function signPayload(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Returns { id, role } if cookie is valid, null otherwise.
// Cookie format: "{sessionId}|{role}.{hmac(sessionId|role)}"
async function parseSession(
  cookie: string,
  secret: string,
): Promise<{ id: string; role: string } | null> {
  const dot = cookie.lastIndexOf('.');
  if (dot < 1) return null;
  const payload  = cookie.substring(0, dot);
  const sig      = cookie.substring(dot + 1);
  const expected = await signPayload(payload, secret);
  if (!safeEqual(sig, expected)) return null;
  const bar = payload.indexOf('|');
  if (bar < 1) return null;
  return { id: payload.substring(0, bar), role: payload.substring(bar + 1) };
}

// ── Header helpers ────────────────────────────────────────────────────────────

function securityHeaders(res: NextResponse): void {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

function noCache(res: NextResponse): void {
  res.headers.set('Cache-Control', 'no-store, max-age=0');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
}

function clearAuthCookies(res: NextResponse): void {
  const options = {
    maxAge: 0,
    expires: new Date(0),
    path: '/',
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
  };
  res.cookies.set(SESSION_COOKIE, '', { ...options, httpOnly: true });
  res.cookies.set(CSRF_COOKIE, '', { ...options, httpOnly: false });
}

// ── Middleware ────────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.ADMIN_SECRET || 'api-docs-secret';

  // ── Public routes (no auth needed) ──────────────────────────────────────────
  const isPublic =
    pathname === '/' ||
    pathname === LOGIN_PATH ||
    pathname.startsWith('/api/admin/auth/') ||
    pathname === '/api/admin/auth' ||
    pathname === '/api/admin/auth/direct-login' ||
    pathname === '/api/admin/logout';

  if (isPublic) {
    const res = NextResponse.next();
    securityHeaders(res);
    return res;
  }

  // ── All other routes: require a valid signed session cookie ──────────────────
  const rawCookie = req.cookies.get(SESSION_COOKIE)?.value ?? '';
  const session   = rawCookie ? await parseSession(rawCookie, secret) : null;

  if (!session) {
    // API routes → 401 JSON
    if (pathname.startsWith('/api/')) {
      const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      clearAuthCookies(res);
      securityHeaders(res);
      noCache(res);
      return res;
    }
    const dest = new URL(LOGIN_PATH, req.url);
    dest.searchParams.set('next', pathname);
    const res = NextResponse.redirect(dest);
    clearAuthCookies(res);
    securityHeaders(res);
    noCache(res);
    return res;
  }

  // ── Admin-only routes: require role === 'admin' ──────────────────────────────
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  if (isAdminRoute && session.role !== 'admin') {
    if (pathname.startsWith('/api/')) {
      const res = NextResponse.json({ error: 'Forbidden — admin access required.' }, { status: 403 });
      securityHeaders(res);
      return res;
    }
    // Regular users cannot access admin pages → send them to docs
    return NextResponse.redirect(new URL('/docs/introduction', req.url));
  }

  // ── CSRF double-submit check for all state-changing API requests ──────────────
  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (pathname.startsWith('/api/') && isMutating) {
    const csrfHeader = req.headers.get('X-CSRF-Token') ?? '';
    const csrfCookie = req.cookies.get(CSRF_COOKIE)?.value ?? '';
    if (!csrfHeader || !csrfCookie || !safeEqual(csrfHeader, csrfCookie)) {
      const res = NextResponse.json({ error: 'Invalid or missing CSRF token.' }, { status: 403 });
      securityHeaders(res);
      return res;
    }
  }

  // ── If an authenticated user hits /login, redirect them home ─────────────────
  // (handled above by the public-route check — but we also guard here for safety)

  const res = NextResponse.next();
  noCache(res);   // never cache authenticated pages — prevents back-button bypass
  securityHeaders(res);
  return res;
}

export const config = {
  // Match everything except Next.js internals and static files
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)',
  ],
};
