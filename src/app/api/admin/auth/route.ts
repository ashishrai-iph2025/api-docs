import { NextResponse } from 'next/server';

// This endpoint is deprecated. Login now uses email OTP:
//   POST /api/admin/auth/request-otp  — step 1: send code
//   POST /api/admin/auth/verify-otp   — step 2: verify code
export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use /api/admin/auth/request-otp and /api/admin/auth/verify-otp.' },
    { status: 410 },
  );
}
