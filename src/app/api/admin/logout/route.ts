import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    sameSite: 'strict',
  });
  res.headers.append(
    'Set-Cookie',
    'admin_session=; Path=/admin; Max-Age=0; HttpOnly; SameSite=Strict'
  );
  return res;
}
