import { NextRequest, NextResponse } from 'next/server';

// ── Session token (Edge-compatible Web Crypto) ────────────────────────────────
// Must match makeSessionToken() in auth/route.ts:
//   HMAC-SHA256(key=ADMIN_SECRET, message="admin:session:v1")
async function getExpectedToken(): Promise<string> {
  const secret = process.env.ADMIN_SECRET || 'api-docs-secret';
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode('admin:session:v1'));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function safeHexEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function addSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return res;
}

function addNoCacheHeaders(res: NextResponse): NextResponse {
  res.headers.set('Cache-Control', 'no-store, max-age=0');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token    = req.cookies.get('admin_session')?.value ?? '';
    const expected = await getExpectedToken();

    if (!token || !safeHexEqual(token, expected)) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('next', pathname);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.set('admin_session', '', { maxAge: 0, path: '/' });
      addSecurityHeaders(res);
      addNoCacheHeaders(res);
      return res;
    }
  }

  if (pathname.startsWith('/api/admin') && pathname !== '/api/admin/auth') {
    const token    = req.cookies.get('admin_session')?.value ?? '';
    const expected = await getExpectedToken();

    if (!token || !safeHexEqual(token, expected)) {
      const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      addSecurityHeaders(res);
      addNoCacheHeaders(res);
      return res;
    }
  }

  const res = NextResponse.next();
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    addNoCacheHeaders(res);
  }
  addSecurityHeaders(res);
  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
