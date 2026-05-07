import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/session';
import fs from 'fs';
import path from 'path';

const ENV_PATH = path.resolve(process.cwd(), '.env.local');

function parseEnv(content: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    map[key] = val;
  }
  return map;
}

function writeEnvKeys(content: string, updates: Record<string, string>): string {
  const lines = content.split('\n');
  const replaced = new Set<string>();

  const result = lines.map(line => {
    const eq = line.indexOf('=');
    if (eq < 1) return line;
    const key = line.slice(0, eq).trim();
    if (key in updates) {
      replaced.add(key);
      return `${key}=${updates[key]}`;
    }
    return line;
  });

  // Append any keys that weren't already in the file
  for (const [key, val] of Object.entries(updates)) {
    if (!replaced.has(key)) result.push(`${key}=${val}`);
  }

  return result.join('\n');
}

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth || auth.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
  const env = parseEnv(content);

  return NextResponse.json({
    host:   env.SMTP_HOST   ?? '',
    port:   env.SMTP_PORT   ?? '587',
    secure: env.SMTP_SECURE ?? 'false',
    user:   env.SMTP_USER   ?? '',
    pass:   env.SMTP_PASS   ? '••••••••' : '',
    from:   env.SMTP_FROM   ?? '',
    hasPass: !!env.SMTP_PASS,
  });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth || auth.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { host, port, secure, user, pass, from } = body as Record<string, string>;

  const content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';

  const updates: Record<string, string> = {
    SMTP_HOST:   host   ?? '',
    SMTP_PORT:   port   ?? '587',
    SMTP_SECURE: secure ?? 'false',
    SMTP_USER:   user   ?? '',
    SMTP_FROM:   from   ?? '',
  };
  // Only overwrite pass if a new value was explicitly provided (not the placeholder)
  if (pass && pass !== '••••••••') {
    updates.SMTP_PASS = pass;
  }

  const updated = writeEnvKeys(content, updates);
  fs.writeFileSync(ENV_PATH, updated, 'utf8');

  return NextResponse.json({ ok: true });
}
