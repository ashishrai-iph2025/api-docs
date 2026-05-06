import fs from 'node:fs';
import path from 'node:path';

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
