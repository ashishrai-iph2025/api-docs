import { NextRequest, NextResponse } from 'next/server';
import { getUsers, createUser, getUserByEmail, logActivity, hashPassword, setUserPassword, type User } from '@/lib/db';

function sanitize(u: User) {
  const { password_hash, ...rest } = u;
  return { ...rest, has_password: !!password_hash };
}
import { getAuthContext } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (ctx.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const users = getUsers().map(sanitize);
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (ctx.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: { email?: string; name?: string; role?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email    = typeof body.email    === 'string' ? body.email.toLowerCase().trim() : '';
  const name     = typeof body.name     === 'string' ? body.name.trim() : '';
  const role     = body.role === 'user' ? 'user' : 'admin';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const existing = getUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
  }

  const user = createUser({ email, name, role, created_by: ctx.user.id });

  const hash = await hashPassword(password);
  setUserPassword(user.id, hash);

  logActivity({
    user_id: ctx.user.id,
    email: ctx.user.email,
    action: 'user_created',
    resource: user.id,
    details: { target_email: email, target_name: name, role },
    ip_address: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
    user_agent: req.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ user: sanitize(user) }, { status: 201 });
}
