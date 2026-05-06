import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getAdminPassword } from '@/lib/admin-config';

// ── Session token ─────────────────────────────────────────────────────────────
// Derived from ADMIN_SECRET only — never from the password.
// This means middleware can validate it without knowing the password.
export function makeSessionToken(): string {
  const secret = process.env.ADMIN_SECRET || 'api-docs-secret';
  return crypto.createHmac('sha256', secret).update('admin:session:v1').digest('hex');
}

// ── Rate-limit store (in-memory, per IP) ─────────────────────────────────────
interface Attempt { count: number; lockedUntil: number; }

const attempts = new Map<string, Attempt>();
const MAX_ATTEMPTS    = 5;
const LOCK_MS         = 15 * 60 * 1000;
const CLEANUP_BUFFER  = 15 * 60 * 1000;

function getAttempt(ip: string): Attempt {
  return attempts.get(ip) ?? { count: 0, lockedUntil: 0 };
}
function isLocked(a: Attempt) { return a.lockedUntil > Date.now(); }
function remainingSecs(a: Attempt) { return Math.ceil((a.lockedUntil - Date.now()) / 1000); }

function recordFailure(ip: string): Attempt {
  const a = getAttempt(ip);
  const count = a.count + 1;
  const lockedUntil = count >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : 0;
  const next = { count, lockedUntil };
  attempts.set(ip, next);
  setTimeout(() => attempts.delete(ip), LOCK_MS + CLEANUP_BUFFER);
  return next;
}

// ── Constant-time comparison ──────────────────────────────────────────────────
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    crypto.timingSafeEqual(Buffer.alloc(1), Buffer.alloc(1));
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  let password: string;
  try {
    const body = await req.json();
    password = typeof body?.password === 'string' ? body.password : '';
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }

  const attempt = getAttempt(ip);
  if (isLocked(attempt)) {
    return NextResponse.json(
      { error: `Too many failed attempts. Try again in ${remainingSecs(attempt)} seconds.`, lockedFor: remainingSecs(attempt) },
      { status: 429 }
    );
  }

  const expected = getAdminPassword();
  if (!safeEqual(password, expected)) {
    const updated = recordFailure(ip);
    if (isLocked(updated)) {
      return NextResponse.json(
        { error: `Too many failed attempts. Account locked for ${remainingSecs(updated)} seconds.`, lockedFor: remainingSecs(updated) },
        { status: 429 }
      );
    }
    const remaining = MAX_ATTEMPTS - updated.count;
    return NextResponse.json(
      { error: `Incorrect password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`, attemptsLeft: remaining },
      { status: 401 }
    );
  }

  attempts.delete(ip);
  const token = makeSessionToken();
  const isProd = process.env.NODE_ENV === 'production';

  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: isProd,
    path: '/',
    maxAge: 60 * 60 * 8,
    sameSite: 'strict',
  });
  return res;
}
