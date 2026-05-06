import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ENV_FILE = path.join(process.cwd(), '.env.local');

function makeToken(pass: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(pass).digest('hex');
}

function readEnvFile(): Record<string, string> {
  const vars: Record<string, string> = {};
  if (!fs.existsSync(ENV_FILE)) return vars;
  for (const line of fs.readFileSync(ENV_FILE, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

function writeEnvFile(vars: Record<string, string>) {
  const lines = fs.existsSync(ENV_FILE)
    ? fs.readFileSync(ENV_FILE, 'utf-8').split('\n')
    : [];

  const updated = new Set<string>();
  const result = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return line;
    const key = trimmed.slice(0, eq).trim();
    if (key in vars) {
      updated.add(key);
      return `${key}=${vars[key]}`;
    }
    return line;
  });

  for (const [key, val] of Object.entries(vars)) {
    if (!updated.has(key)) result.push(`${key}=${val}`);
  }

  fs.writeFileSync(ENV_FILE, result.join('\n'));
}

export async function POST(req: NextRequest) {
  const { currentPassword, newPassword } = await req.json();

  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
  }

  const env = readEnvFile();
  const storedPass = env.ADMIN_PASSWORD || 'admin123';

  if (currentPassword !== storedPass) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
  }

  const secret = env.ADMIN_SECRET || 'api-docs-secret-change-me';
  writeEnvFile({ ...env, ADMIN_PASSWORD: newPassword });

  const newToken = makeToken(newPassword, secret);
  const isProd = process.env.NODE_ENV === 'production';
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', newToken, {
    httpOnly: true,
    secure: isProd,
    path: '/',
    maxAge: 60 * 60 * 8,
    sameSite: 'strict',
  });
  return res;
}
