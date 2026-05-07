import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/session';
import { getSmtpSettings, setSetting } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth || auth.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getSmtpSettings();

  // Merge DB values with env var fallbacks
  const host   = db.smtp_host   || process.env.SMTP_HOST   || '';
  const port   = db.smtp_port   || process.env.SMTP_PORT   || '587';
  const secure = db.smtp_secure || process.env.SMTP_SECURE || 'false';
  const user   = db.smtp_user   || process.env.SMTP_USER   || '';
  const from   = db.smtp_from   || process.env.SMTP_FROM   || '';
  const hasPass = !!(db.smtp_pass || process.env.SMTP_PASS);

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
