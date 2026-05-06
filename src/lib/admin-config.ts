import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const CONFIG_FILE = path.join(process.cwd(), 'data', 'admin-config.json');

interface AdminConfig {
  password: string;
}

function readConfig(): AdminConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch {}
  return { password: process.env.ADMIN_PASSWORD || 'admin123' };
}

export function getAdminPassword(): string {
  return readConfig().password;
}

export function setAdminPassword(newPassword: string): void {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ password: newPassword }, null, 2));
}

// Session token — derived from ADMIN_SECRET only, never from the password.
// Changing the password does NOT invalidate existing sessions.
export function makeSessionToken(): string {
  const secret = process.env.ADMIN_SECRET || 'api-docs-secret';
  return crypto.createHmac('sha256', secret).update('admin:session:v1').digest('hex');
}
