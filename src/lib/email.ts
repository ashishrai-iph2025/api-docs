import nodemailer from 'nodemailer';
import { getSmtpSettings } from './db';

function getSmtpConfig() {
  // DB settings take priority over env vars (set via admin Settings page)
  const db = getSmtpSettings();
  const provider = (process.env.EMAIL_PROVIDER || process.env.MAIL_PROVIDER || '').toLowerCase();

  if (provider === 'ses' || provider === 'aws-ses' || process.env.AWS_SES_REGION) {
    const region = process.env.AWS_SES_REGION || process.env.SES_REGION || 'ap-south-1';
    return {
      host: process.env.AWS_SES_SMTP_HOST || process.env.SES_SMTP_HOST || db.smtp_host || `email-smtp.${region}.amazonaws.com`,
      port: parseInt(process.env.AWS_SES_SMTP_PORT || process.env.SES_SMTP_PORT || db.smtp_port || '587'),
      secure: (process.env.AWS_SES_SMTP_SECURE || process.env.SES_SMTP_SECURE || db.smtp_secure || 'false') === 'true',
      user: process.env.AWS_SES_SMTP_USER || process.env.SES_SMTP_USER || db.smtp_user || '',
      pass: process.env.AWS_SES_SMTP_PASS || process.env.SES_SMTP_PASS || db.smtp_pass || '',
      from: process.env.AWS_SES_FROM || process.env.SES_FROM || db.smtp_from || '',
    };
  }

  return {
    host:   db.smtp_host   || process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   parseInt(db.smtp_port   || process.env.SMTP_PORT   || '587'),
    secure: (db.smtp_secure || process.env.SMTP_SECURE || 'false') === 'true',
    user:   db.smtp_user   || process.env.SMTP_USER   || '',
    pass:   db.smtp_pass   || process.env.SMTP_PASS   || '',
    from:   db.smtp_from   || process.env.SMTP_FROM   || '',
  };
}

export async function sendOtpEmail(to: string, code: string, name?: string): Promise<void> {
  // Always log to console as fallback
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`[OTP] Code for ${to}: ${code}`);
  console.log(`${'─'.repeat(50)}\n`);

  const cfg = getSmtpConfig();
  if (!cfg.user || !cfg.pass) return; // no SMTP configured — console only

  const greeting = name ? `Hi ${name},` : 'Hello,';
  const from = cfg.from && cfg.from.includes('@')
    ? cfg.from
    : `"${cfg.from || 'API Documentation'}" <${cfg.user}>`;

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    connectionTimeout: 8000,
    greetingTimeout:   5000,
    socketTimeout:     10000,
  });

  await transporter.sendMail({
    from,
    to,
    subject: 'Your verification code to access API Documentation',
    text: [
      greeting,
      '',
      'Use this code to sign in to the API Documentation.',
      '',
      `  ${code}`,
      '',
      'This code expires in 10 minutes.',
      '',
      'If you did not request this code, you can safely ignore this email.',
    ].join('\n'),
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:440px;" cellpadding="0" cellspacing="0">
        <tr><td style="background:#ffffff;border-radius:16px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827;">Your Verification Code</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">${greeting}<br>Use this code to sign in to the API Documentation.</p>
          <div style="background:#f0f4ff;border-radius:12px;padding:28px;text-align:center;margin-bottom:24px;">
            <span style="font-size:40px;font-weight:700;letter-spacing:10px;font-family:'Courier New',monospace;color:#1877f2;">${code}</span>
          </div>
          <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;line-height:1.5;">⏱ This code expires in <strong>10 minutes</strong>.</p>
          <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">If you didn't request this, you can safely ignore this email.</p>
        </td></tr>
        <tr><td style="padding-top:20px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">API Documentation · Internal use only</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
  });
}
