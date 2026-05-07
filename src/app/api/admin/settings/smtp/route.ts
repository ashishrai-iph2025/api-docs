import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/session';
import { getSmtpSettings, setSetting } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth || auth.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getSmtpSettings();
  const provider = (process.env.EMAIL_PROVIDER || process.env.MAIL_PROVIDER || '').toLowerCase();
  const useSes = provider === 'ses' || provider === 'aws-ses' || !!process.env.AWS_SES_REGION;
  const sesRegion = process.env.AWS_SES_REGION || process.env.SES_REGION || 'ap-south-1';

  // Merge DB values with env var fallbacks
  const host = useSes
    ? process.env.AWS_SES_SMTP_HOST || process.env.SES_SMTP_HOST || db.smtp_host || `email-smtp.${sesRegion}.amazonaws.com`
    : db.smtp_host || process.env.SMTP_HOST || '';
  const port = useSes
    ? process.env.AWS_SES_SMTP_PORT || process.env.SES_SMTP_PORT || db.smtp_port || '587'
    : db.smtp_port || process.env.SMTP_PORT || '587';
  const secure = useSes
    ? process.env.AWS_SES_SMTP_SECURE || process.env.SES_SMTP_SECURE || db.smtp_secure || 'false'
    : db.smtp_secure || process.env.SMTP_SECURE || 'false';
  const user = useSes
    ? process.env.AWS_SES_SMTP_USER || process.env.SES_SMTP_USER || db.smtp_user || ''
    : db.smtp_user || process.env.SMTP_USER || '';
  const from = useSes
    ? process.env.AWS_SES_FROM || process.env.SES_FROM || db.smtp_from || ''
    : db.smtp_from || process.env.SMTP_FROM || '';
  const hasPass = useSes
    ? !!(process.env.AWS_SES_SMTP_PASS || process.env.SES_SMTP_PASS || db.smtp_pass)
    : !!(db.smtp_pass || process.env.SMTP_PASS);

  return NextResponse.json({ host, port, secure, user, from, hasPass });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth || auth.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { host, port, secure, user, pass, from } = body as Record<string, string>;

  if (host  !== undefined) setSetting('smtp_host',   host);
  if (port  !== undefined) setSetting('smtp_port',   port);
  if (secure !== undefined) setSetting('smtp_secure', secure);
  if (user  !== undefined) setSetting('smtp_user',   user);
  if (from  !== undefined) setSetting('smtp_from',   from);
  // Only save password if a real value was provided (not the placeholder)
  if (pass && pass !== '••••••••') setSetting('smtp_pass', pass);

  return NextResponse.json({ ok: true });
}
