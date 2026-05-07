import nodemailer from 'nodemailer';

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 8000,   // 8s to establish TCP connection
    greetingTimeout:   5000,   // 5s for SMTP greeting
    socketTimeout:     10000,  // 10s idle socket
  });
}

export async function sendOtpEmail(to: string, code: string, name?: string): Promise<void> {
  // Always log to console as a fallback (useful when email fails or in dev)
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`[OTP] Code for ${to}: ${code}`);
  console.log(`${'─'.repeat(50)}\n`);

  if (!process.env.SMTP_USER) return;

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const greeting = name ? `Hi ${name},` : 'Hello,';
  const transporter = createTransport();

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
</html>
    `.trim(),
  });
}
