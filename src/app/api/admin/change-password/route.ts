import { NextRequest, NextResponse } from 'next/server';
import { getAdminPassword, setAdminPassword } from '@/lib/admin-config';
import { makeSessionToken } from '@/app/api/admin/auth/route';

export async function POST(req: NextRequest) {
  const { currentPassword, newPassword } = await req.json();

  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
  }

  const stored = getAdminPassword();
  if (currentPassword !== stored) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
  }

  setAdminPassword(newPassword);

  // Re-issue the session cookie (token is unchanged — it's based on ADMIN_SECRET, not the password)
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
