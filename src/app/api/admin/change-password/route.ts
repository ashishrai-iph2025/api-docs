import { NextResponse } from 'next/server';

// Deprecated: authentication is now email OTP-based — there are no passwords.
// User management is done via /api/admin/users.
export async function POST() {
  return NextResponse.json(
    { error: 'Password-based authentication has been removed. Login uses email verification codes.' },
    { status: 410 },
  );
}
