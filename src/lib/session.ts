import crypto from 'crypto';
import { getSession, getUserById, type Session, type User } from './db';

export const SESSION_COOKIE = 'session_id';
export const CSRF_COOKIE    = 'csrf_token';

// ── Signed cookie format: "{uuid}|{role}.{hmac}" ─────────────────────────────
// The "|" separates session-id from role (both are part of the signed payload).
// The last "." separates the payload from the HMAC signature.
// This lets the Edge middleware read the role without a DB round-trip.

function getSecret(): string {
  return process.env.ADMIN_SECRET || 'api-docs-secret';
}

function signPayload(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
}

export function makeSignedCookie(sessionId: string, role: string): string {
  const payload = `${sessionId}|${role}`;
  return `${payload}.${signPayload(payload)}`;
}

export function parseSignedCookie(cookie: string): { id: string; role: string } | null {
  const dot = cookie.lastIndexOf('.');
  if (dot < 1) return null;
  const payload  = cookie.substring(0, dot);
  const sig      = cookie.substring(dot + 1);
  const expected = signPayload(payload);
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;
  const bar = payload.indexOf('|');
  if (bar < 1) return null;
  return { id: payload.substring(0, bar), role: payload.substring(bar + 1) };
}

// ── Extract session ID from a raw Request ─────────────────────────────────────

export function getSessionIdFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie') ?? '';
  return getSessionIdFromCookieHeader(cookieHeader);
}

export function getSessionIdFromCookieHeader(cookieHeader: string): string | null {
  for (const pair of cookieHeader.split(';')) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx < 0) continue;
    if (pair.substring(0, eqIdx).trim() === SESSION_COOKIE) {
      const parsed = parseSignedCookie(decodeURIComponent(pair.substring(eqIdx + 1).trim()));
      return parsed?.id ?? null;
    }
  }
  return null;
}

export async function getAuthContextFromCookieHeader(cookieHeader: string): Promise<{
  session: Session;
  user: User;
} | null> {
  const sessionId = getSessionIdFromCookieHeader(cookieHeader);
  if (!sessionId) return null;
  const session = getSession(sessionId);
  if (!session) return null;
  const user = getUserById(session.user_id);
  if (!user || !user.is_active) return null;
  return { session, user };
}

// ── Full auth check for API/server routes (Node.js, not Edge) ─────────────────

export async function getAuthContext(req: Request): Promise<{
  session: Session;
  user: User;
} | null> {
  return getAuthContextFromCookieHeader(req.headers.get('cookie') ?? '');
}

// ── Cookie option helpers ─────────────────────────────────────────────────────

export function sessionCookieOptions(maxAge = 60 * 60 * 8) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
    sameSite: 'strict' as const,
  };
}

export function csrfCookieOptions(maxAge = 60 * 60 * 8) {
  return {
    httpOnly: false,   // must be readable by JS (double-submit CSRF pattern)
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
    sameSite: 'strict' as const,
  };
}
