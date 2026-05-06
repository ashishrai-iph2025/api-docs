import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ENV_FILE = path.join(process.cwd(), '.env.local');

function readAdminPassword(): string {
  if (fs.existsSync(ENV_FILE)) {
    for (const line of fs.readFileSync(ENV_FILE, 'utf-8').split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('ADMIN_PASSWORD=')) {
        return trimmed.slice('ADMIN_PASSWORD='.length).trim();
      }
    }
  }
  return process.env.ADMIN_PASSWORD || '';
}

// ── Rate-limit store (in-memory, per IP) ─────────────────────────────────────
// Resets on server restart. Good enough for a single-process deployment.
interface Attempt {
  count: number;
  lockedUntil: number; // epoch ms, 0 = not locked
}

const attempts = new Map<string, Attempt>();

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const WINDOW_MS = 15 * 60 * 1000;        // reset window

function getAttempt(ip: string): Attempt {
  return attempts.get(ip) ?? { count: 0, lockedUntil: 0 };
}

function isLocked(a: Attempt): boolean {
  return a.lockedUntil > Date.now();
}

function remainingSeconds(a: Attempt): number {
  return Math.ceil((a.lockedUntil - Date.now()) / 1000);
}

function recordFailure(ip: string): Attempt {
  const a = getAttempt(ip);
  const now = Date.now();
  const count = a.count + 1;
  const lockedUntil = count >= MAX_ATTEMPTS ? now + LOCK_DURATION_MS : 0;
  const next: Attempt = { count, lockedUntil };
  attempts.set(ip, next);

  // Auto-cleanup after lock expires + buffer
  setTimeout(() => attempts.delete(ip), LOCK_DURATION_MS + WINDOW_MS);
  return next;
}

function clearAttempts(ip: string) {
  attempts.delete(ip);
}

// ── Token helpers ─────────────────────────────────────────────────────────────
function makeToken(): string {
  const pass   = readAdminPassword();
  const secret = process.env.ADMIN_SECRET     || 'api-docs-secret';
  return crypto.createHmac('sha256', secret).update(pass).digest('hex');
}

// Constant-time string comparison — prevents timing attacks
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still run a dummy comparison so timing is consistent
    crypto.timingSafeEqual(Buffer.alloc(1), Buffer.alloc(1));
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {

  // Derive requester IP from common proxy headers or socket
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  const attempt = getAttempt(ip);

  // Parse body safely
  let password: string;
  try {
    const body = await req.json();
    password = typeof body?.password === 'string' ? body.password : '';
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }

  const expected = readAdminPassword();
  const passwordMatches = safeEqual(password, expected);

  if (!passwordMatches) {
    if (isLocked(attempt)) {
      return NextResponse.json(
        {
          error: `Too many failed attempts. Try again in ${remainingSeconds(attempt)} seconds.`,
          lockedFor: remainingSeconds(attempt),
        },
        { status: 429 }
      );
    }

    const updated = recordFailure(ip);
    const remaining = MAX_ATTEMPTS - updated.count;

    if (isLocked(updated)) {
      return NextResponse.json(
        {
          error: `Too many failed attempts. Account locked for ${remainingSeconds(updated)} seconds.`,
          lockedFor: remainingSeconds(updated),
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: `Incorrect password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        attemptsLeft: remaining,
      },
      { status: 401 }
    );
  }

  // Success — clear failures, issue session cookie
  clearAttempts(ip);
  const token = makeToken();
  const isProd = process.env.NODE_ENV === 'production';

  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: isProd,
    path: '/',               // sent to admin pages and protected admin API routes
    maxAge: 60 * 60 * 8,     // 8-hour session
    sameSite: 'strict',      // strict: never sent cross-origin
  });
  return res;
}
