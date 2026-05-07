import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUser, setUserActive, setUserOtpEnabled, setUserPassword, hashPassword, getUserByEmail, logActivity, type User } from '@/lib/db';

function sanitize(u: User) {
  const { password_hash, ...rest } = u;
  return { ...rest, has_password: !!password_hash };
}
import { getAuthContext } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (ctx.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const user = getUserById(params.id);
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  return NextResponse.json({ user });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (ctx.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const target = getUserById(params.id);
  if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  let body: { name?: string; role?: string; email?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const updates: { name?: string; role?: 'admin' | 'user'; email?: string } = {};
  if (typeof body.name  === 'string') updates.name  = body.name.trim();
  if (typeof body.email === 'string') {
    const email = body.email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }
    if (email !== target.email) {
      const conflict = getUserByEmail(email);
      if (conflict && conflict.id !== params.id) {
        return NextResponse.json({ error: 'Email is already in use.' }, { status: 409 });
      }
    }
    updates.email = email;
  }
  if (body.role === 'admin' || body.role === 'user') updates.role = body.role;

  const updated = updateUser(params.id, updates);

  logActivity({
    user_id: ctx.user.id,
    email: ctx.user.email,
    action: 'user_updated',
    resource: params.id,
    details: { changes: updates, target_email: target.email },
    ip_address: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
    user_agent: req.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ user: updated ? sanitize(updated) : null });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  // PATCH is used to activate/deactivate a user
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (ctx.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const target = getUserById(params.id);
  if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  let body: { is_active?: boolean; otp_enabled?: boolean; password?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (typeof body.password === 'string') {
    if (body.password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    const hash = await hashPassword(body.password);
    setUserPassword(params.id, hash);
    logActivity({
      user_id: ctx.user.id,
      email: ctx.user.email,
      action: 'user_password_set',
      resource: params.id,
      details: { target_email: target.email },
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
      user_agent: req.headers.get('user-agent') ?? undefined,
    });
    return NextResponse.json({ ok: true, has_password: true });
  }

  if (typeof body.is_active === 'boolean') {
    if (params.id === ctx.user.id) {
      return NextResponse.json({ error: 'You cannot deactivate your own account.' }, { status: 400 });
    }
    setUserActive(params.id, body.is_active);
    logActivity({
      user_id: ctx.user.id,
      email: ctx.user.email,
      action: body.is_active ? 'user_activated' : 'user_deactivated',
      resource: params.id,
      details: { target_email: target.email },
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
      user_agent: req.headers.get('user-agent') ?? undefined,
    });
    return NextResponse.json({ ok: true, is_active: body.is_active });
  }

  if (typeof body.otp_enabled === 'boolean') {
    setUserOtpEnabled(params.id, body.otp_enabled);
    logActivity({
      user_id: ctx.user.id,
      email: ctx.user.email,
      action: 'user_updated',
      resource: params.id,
      details: { target_email: target.email, otp_enabled: body.otp_enabled },
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
      user_agent: req.headers.get('user-agent') ?? undefined,
    });
    return NextResponse.json({ ok: true, otp_enabled: body.otp_enabled });
  }

  return NextResponse.json({ error: 'No valid field to update.' }, { status: 400 });
}
