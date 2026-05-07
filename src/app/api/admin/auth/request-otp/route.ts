import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createOtp, logActivity } from '@/lib/db';
import { sendOtpEmail } from '@/lib/email';

// In-memory rate limit: max 3 OTP requests per email per 15 min
const otpRequests = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const entry = otpRequests.get(email);
  if (!entry || entry.resetAt < now) {
    otpRequests.set(email, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  if (entry.count >= 3) return true;
  entry.count++;
  return false;
}

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || '127.0.0.1';
}

export async function POST(req: NextRequest) {
  let email: string;
  try {
    const body = await req.json();
    email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
  }

  const ip = getIp(req);

  const user = getUserByEmail(email);

  if (!user || !user.is_active) {
    return NextResponse.json(
      { error: 'This email address is not authorised to access this platform.' },
      { status: 403 },
    );
  }

  if (isRateLimited(email)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait 15 minutes before trying again.' },
      { status: 429 },
    );
  }

  // If 2FA is disabled for this user, signal the client to skip OTP
  if (user.otp_enabled === 0) {
    return NextResponse.json({ ok: true, otp_required: false });
  }

  // Generate 6-digit OTP
  const code = String(Math.floor(100000 + Math.random() * 900000));
  createOtp(email, code);

  logActivity({
    user_id: user.id,
    email,
    action: 'otp_requested',
    ip_address: ip,
    user_agent: req.headers.get('user-agent') ?? undefined,
  });

  // Wait for the mail provider so deployments do not report success before SES accepts the email.
  try {
    await sendOtpEmail(email, code, user.name || undefined);
  } catch (err) {
    console.error('[OTP] Email send failed:', err);
    return NextResponse.json(
      { error: 'Could not send verification email. Please contact support.' },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
