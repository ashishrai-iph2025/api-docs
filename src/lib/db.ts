import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = await scrypt(password, salt, 64) as Buffer;
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), derived);
}

const DB_PATH = path.join(process.cwd(), 'data', 'app.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
    seedAdminUser(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      name        TEXT NOT NULL DEFAULT '',
      role        TEXT NOT NULL DEFAULT 'admin',
      is_active   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL,
      created_by  TEXT,
      last_login  TEXT
    );

    CREATE TABLE IF NOT EXISTS otp_tokens (
      id          TEXT PRIMARY KEY,
      email       TEXT NOT NULL,
      code        TEXT NOT NULL,
      expires_at  TEXT NOT NULL,
      used        INTEGER NOT NULL DEFAULT 0,
      attempts    INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      csrf_token  TEXT NOT NULL,
      expires_at  TEXT NOT NULL,
      created_at  TEXT NOT NULL,
      ip_address  TEXT,
      user_agent  TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id          TEXT PRIMARY KEY,
      user_id     TEXT,
      email       TEXT,
      action      TEXT NOT NULL,
      resource    TEXT,
      details     TEXT,
      ip_address  TEXT,
      user_agent  TEXT,
      created_at  TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user    ON sessions(user_id);
  `);

  // Settings table for runtime config (SMTP etc.)
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS playground_logs (
      id                TEXT PRIMARY KEY,
      user_id           TEXT NOT NULL,
      token_id          TEXT,
      endpoint_id       TEXT NOT NULL,
      endpoint_title    TEXT NOT NULL,
      method            TEXT NOT NULL,
      path              TEXT NOT NULL,
      api_username      TEXT,
      request_body      TEXT,
      response_status   INTEGER,
      response_time_ms  INTEGER,
      response_preview  TEXT,
      token_issued      INTEGER NOT NULL DEFAULT 0,
      created_at        TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (token_id) REFERENCES playground_tokens(id)
    );

    CREATE TABLE IF NOT EXISTS playground_tokens (
      id                TEXT PRIMARY KEY,
      user_id           TEXT NOT NULL,
      api_username      TEXT,
      login_url         TEXT NOT NULL,
      token_hash        TEXT NOT NULL,
      token_value       TEXT NOT NULL,
      token_preview     TEXT NOT NULL,
      response_status   INTEGER,
      response_time_ms  INTEGER,
      created_at        TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_playground_user    ON playground_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_playground_created ON playground_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_playground_endpoint ON playground_logs(endpoint_id);
    CREATE INDEX IF NOT EXISTS idx_pg_tokens_user      ON playground_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_pg_tokens_hash      ON playground_tokens(token_hash);
    CREATE INDEX IF NOT EXISTS idx_pg_tokens_created   ON playground_tokens(created_at);
  `);

  // Migrations
  const cols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!cols.find(c => c.name === 'otp_enabled')) {
    db.exec("ALTER TABLE users ADD COLUMN otp_enabled INTEGER NOT NULL DEFAULT 1");
  }
  if (!cols.find(c => c.name === 'password_hash')) {
    db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT");
  }

  const playgroundLogCols = db.prepare("PRAGMA table_info(playground_logs)").all() as { name: string }[];
  if (!playgroundLogCols.find(c => c.name === 'token_id')) {
    db.exec("ALTER TABLE playground_logs ADD COLUMN token_id TEXT");
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_otp_email        ON otp_tokens(email);
    CREATE INDEX IF NOT EXISTS idx_activity_user    ON activity_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_action  ON activity_logs(action);
    CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_playground_token ON playground_logs(token_id);
  `);
}

function seedAdminUser(db: Database.Database) {
  const email = process.env.ADMIN_EMAIL;
  if (!email) return;
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string } | null;
  if (!existing) {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO users (id, email, name, role, is_active, created_at, updated_at)
      VALUES (?, ?, 'Administrator', 'admin', 1, ?, ?)
    `).run(id, email, now, now);
  }
  // Set password from env if provided and not already set
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword) {
    const user = db.prepare('SELECT id, password_hash FROM users WHERE email = ?').get(email) as { id: string; password_hash: string | null } | null;
    if (user && !user.password_hash) {
      // Hash synchronously for seed (blocking is fine at startup)
      const salt = crypto.randomBytes(16).toString('hex');
      const derived = crypto.scryptSync(adminPassword, salt, 64);
      const hash = `${salt}:${derived.toString('hex')}`;
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
    }
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  is_active: number;
  otp_enabled: number;
  password_hash: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  last_login: string | null;
}

export interface OtpToken {
  id: string;
  email: string;
  code: string;
  expires_at: string;
  used: number;
  attempts: number;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  csrf_token: string;
  expires_at: string;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  email: string | null;
  action: string;
  resource: string | null;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export function getUsers(): User[] {
  return getDb().prepare('SELECT * FROM users ORDER BY created_at DESC').all() as User[];
}

export function getUserById(id: string): User | null {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as User | null;
}

export function getUserByEmail(email: string): User | null {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email) as User | null;
}

export function createUser(data: {
  email: string;
  name: string;
  role: 'admin' | 'user';
  created_by?: string;
}): User {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  getDb().prepare(`
    INSERT INTO users (id, email, name, role, is_active, created_at, updated_at, created_by)
    VALUES (?, ?, ?, ?, 1, ?, ?, ?)
  `).run(id, data.email.toLowerCase().trim(), data.name.trim(), data.role, now, now, data.created_by ?? null);
  return getUserById(id)!;
}

export function updateUser(id: string, data: { name?: string; role?: 'admin' | 'user'; email?: string }): User | null {
  const now = new Date().toISOString();
  const fields: string[] = ['updated_at = ?'];
  const values: unknown[] = [now];
  if (data.name !== undefined) { fields.unshift('name = ?'); values.unshift(data.name.trim()); }
  if (data.role !== undefined) { fields.unshift('role = ?'); values.unshift(data.role); }
  if (data.email !== undefined) { fields.unshift('email = ?'); values.unshift(data.email.toLowerCase().trim()); }
  values.push(id);
  getDb().prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getUserById(id);
}

export function setUserPassword(id: string, hash: string): void {
  getDb().prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
    .run(hash, new Date().toISOString(), id);
}

export function setUserOtpEnabled(id: string, enabled: boolean): void {
  getDb().prepare('UPDATE users SET otp_enabled = ?, updated_at = ? WHERE id = ?')
    .run(enabled ? 1 : 0, new Date().toISOString(), id);
}

export function setUserActive(id: string, active: boolean): void {
  getDb().prepare('UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?')
    .run(active ? 1 : 0, new Date().toISOString(), id);
}

export function updateLastLogin(userId: string): void {
  getDb().prepare('UPDATE users SET last_login = ? WHERE id = ?')
    .run(new Date().toISOString(), userId);
}

export function getUserCount(): number {
  const row = getDb().prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
  return row.c;
}

// ── OTP tokens ────────────────────────────────────────────────────────────────

export function createOtp(email: string, code: string): OtpToken {
  const db = getDb();
  db.prepare("UPDATE otp_tokens SET used = 1 WHERE email = ? AND used = 0").run(email);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  db.prepare(`
    INSERT INTO otp_tokens (id, email, code, expires_at, used, attempts, created_at)
    VALUES (?, ?, ?, ?, 0, 0, ?)
  `).run(id, email, code, expiresAt, now);
  return db.prepare('SELECT * FROM otp_tokens WHERE id = ?').get(id) as OtpToken;
}

export function getValidOtp(email: string): OtpToken | null {
  return getDb().prepare(`
    SELECT * FROM otp_tokens
    WHERE email = ? AND used = 0 AND expires_at > ? AND attempts < 5
    ORDER BY created_at DESC LIMIT 1
  `).get(email, new Date().toISOString()) as OtpToken | null;
}

export function incrementOtpAttempt(id: string): void {
  getDb().prepare('UPDATE otp_tokens SET attempts = attempts + 1 WHERE id = ?').run(id);
}

export function markOtpUsed(id: string): void {
  getDb().prepare('UPDATE otp_tokens SET used = 1 WHERE id = ?').run(id);
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export function createSession(userId: string, ip?: string, ua?: string): Session {
  const id = crypto.randomUUID();
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
  getDb().prepare(`
    INSERT INTO sessions (id, user_id, csrf_token, expires_at, created_at, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, csrfToken, expiresAt, now, ip ?? null, ua ?? null);
  return getDb().prepare('SELECT * FROM sessions WHERE id = ?').get(id) as Session;
}

export function getSession(id: string): Session | null {
  return getDb().prepare(
    'SELECT * FROM sessions WHERE id = ? AND expires_at > ?'
  ).get(id, new Date().toISOString()) as Session | null;
}

export function deleteSession(id: string): void {
  getDb().prepare('DELETE FROM sessions WHERE id = ?').run(id);
}

export function deleteExpiredSessions(): void {
  getDb().prepare('DELETE FROM sessions WHERE expires_at <= ?').run(new Date().toISOString());
}

// ── Activity logs ─────────────────────────────────────────────────────────────

export function logActivity(data: {
  user_id?: string;
  email?: string;
  action: string;
  resource?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}): void {
  try {
    getDb().prepare(`
      INSERT INTO activity_logs (id, user_id, email, action, resource, details, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      data.user_id ?? null,
      data.email ?? null,
      data.action,
      data.resource ?? null,
      data.details ? JSON.stringify(data.details) : null,
      data.ip_address ?? null,
      data.user_agent ?? null,
      new Date().toISOString(),
    );
  } catch {
    // Non-fatal — don't break the request if logging fails
  }
}

export interface ActivityFilters {
  user_id?: string;
  action?: string;
  limit?: number;
  offset?: number;
}

export function getActivityLogs(filters: ActivityFilters = {}): ActivityLog[] {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (filters.user_id) { conditions.push('al.user_id = ?'); params.push(filters.user_id); }
  if (filters.action)  { conditions.push('al.action = ?');  params.push(filters.action); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(filters.limit ?? 100, filters.offset ?? 0);
  return getDb().prepare(`
    SELECT al.* FROM activity_logs al ${where}
    ORDER BY al.created_at DESC LIMIT ? OFFSET ?
  `).all(...params) as ActivityLog[];
}

export function getActivityCount(filters: Pick<ActivityFilters, 'user_id' | 'action'> = {}): number {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (filters.user_id) { conditions.push('user_id = ?'); params.push(filters.user_id); }
  if (filters.action)  { conditions.push('action = ?');  params.push(filters.action); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const row = getDb().prepare(`SELECT COUNT(*) as c FROM activity_logs ${where}`).get(...params) as { c: number };
  return row.c;
}

export function getRecentActivity(limit = 10): ActivityLog[] {
  return getDb().prepare(
    'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?'
  ).all(limit) as ActivityLog[];
}

// ── Settings ──────────────────────────────────────────────────────────────────

export function getSetting(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | null;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  getDb().prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);
}

export function getSmtpSettings(): Record<string, string> {
  const rows = getDb().prepare("SELECT key, value FROM settings WHERE key LIKE 'smtp_%'").all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

// ── Active sessions (with user info) ──────────────────────────────────────────

export interface SessionWithUser extends Session {
  user_email: string;
  user_name: string;
  user_role: string;
}

export function getAllActiveSessions(): SessionWithUser[] {
  return getDb().prepare(`
    SELECT s.*, u.email as user_email, u.name as user_name, u.role as user_role
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.expires_at > ?
    ORDER BY s.created_at DESC
  `).all(new Date().toISOString()) as SessionWithUser[];
}

export function getSessionsByUser(userId: string): Session[] {
  return getDb().prepare(
    'SELECT * FROM sessions WHERE user_id = ? AND expires_at > ? ORDER BY created_at DESC'
  ).all(userId, new Date().toISOString()) as Session[];
}

// ── Playground logs ───────────────────────────────────────────────────────────

export interface PlaygroundLog {
  id: string;
  user_id: string;
  token_id: string | null;
  endpoint_id: string;
  endpoint_title: string;
  method: string;
  path: string;
  api_username: string | null;
  request_body: string | null;
  response_status: number | null;
  response_time_ms: number | null;
  response_preview: string | null;
  token_issued: number;
  created_at: string;
}

export interface PlaygroundToken {
  id: string;
  user_id: string;
  api_username: string | null;
  login_url: string;
  token_hash: string;
  token_value: string;
  token_preview: string;
  response_status: number | null;
  response_time_ms: number | null;
  created_at: string;
}

function hashPlaygroundToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function previewPlaygroundToken(token: string): string {
  if (token.length <= 24) return token;
  return `${token.slice(0, 12)}...${token.slice(-8)}`;
}

export function createPlaygroundToken(data: {
  user_id: string;
  api_username?: string;
  login_url: string;
  token: string;
  response_status?: number;
  response_time_ms?: number;
}): PlaygroundToken {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const tokenHash = hashPlaygroundToken(data.token);
  db.prepare(`
    INSERT INTO playground_tokens
      (id, user_id, api_username, login_url, token_hash, token_value, token_preview,
       response_status, response_time_ms, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.user_id,
    data.api_username ?? null,
    data.login_url,
    tokenHash,
    data.token,
    previewPlaygroundToken(data.token),
    data.response_status ?? null,
    data.response_time_ms ?? null,
    now,
  );

  return db.prepare('SELECT * FROM playground_tokens WHERE id = ?').get(id) as PlaygroundToken;
}

export function getPlaygroundTokenByValue(token: string): PlaygroundToken | null {
  return getDb().prepare(`
    SELECT * FROM playground_tokens
    WHERE token_hash = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(hashPlaygroundToken(token)) as PlaygroundToken | null;
}

export function logPlaygroundCall(data: {
  user_id: string;
  token_id?: string;
  endpoint_id: string;
  endpoint_title: string;
  method: string;
  path: string;
  api_username?: string;
  request_body?: string;
  response_status?: number;
  response_time_ms?: number;
  response_preview?: string;
  token_issued?: boolean;
}): void {
  try {
    getDb().prepare(`
      INSERT INTO playground_logs
        (id, user_id, token_id, endpoint_id, endpoint_title, method, path, api_username,
         request_body, response_status, response_time_ms, response_preview, token_issued, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      data.user_id,
      data.token_id ?? null,
      data.endpoint_id,
      data.endpoint_title,
      data.method,
      data.path,
      data.api_username ?? null,
      data.request_body ?? null,
      data.response_status ?? null,
      data.response_time_ms ?? null,
      data.response_preview ?? null,
      data.token_issued ? 1 : 0,
      new Date().toISOString(),
    );
  } catch { /* non-fatal */ }
}

export function getPlaygroundLogs(userId: string, limit = 50, offset = 0): PlaygroundLog[] {
  return getDb().prepare(`
    SELECT pl.*, pt.token_preview
    FROM playground_logs pl
    LEFT JOIN playground_tokens pt ON pt.id = pl.token_id
    WHERE pl.user_id = ?
    ORDER BY pl.created_at DESC LIMIT ? OFFSET ?
  `).all(userId, limit, offset) as PlaygroundLog[];
}

export function getAllPlaygroundLogs(limit = 100, offset = 0): (PlaygroundLog & { user_email: string; user_name: string })[] {
  return getDb().prepare(`
    SELECT pl.*, u.email as user_email, u.name as user_name, pt.token_preview
    FROM playground_logs pl
    JOIN users u ON u.id = pl.user_id
    LEFT JOIN playground_tokens pt ON pt.id = pl.token_id
    ORDER BY pl.created_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset) as (PlaygroundLog & { user_email: string; user_name: string })[];
}

export function getPlaygroundTokens(userId: string, limit = 50, offset = 0): PlaygroundToken[] {
  return getDb().prepare(`
    SELECT * FROM playground_tokens
    WHERE user_id = ?
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(userId, limit, offset) as PlaygroundToken[];
}

export function getAllPlaygroundTokens(limit = 100, offset = 0): (PlaygroundToken & { user_email: string; user_name: string })[] {
  return getDb().prepare(`
    SELECT pt.*, u.email as user_email, u.name as user_name
    FROM playground_tokens pt
    JOIN users u ON u.id = pt.user_id
    ORDER BY pt.created_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset) as (PlaygroundToken & { user_email: string; user_name: string })[];
}

export interface PlaygroundStats {
  total_calls: number;
  success_calls: number;
  failed_calls: number;
  tokens_issued: number;
  avg_response_ms: number | null;
  by_endpoint: { endpoint_id: string; endpoint_title: string; count: number; success: number }[];
}

export function getPlaygroundStats(userId?: string): PlaygroundStats {
  const db = getDb();
  const where = userId ? 'WHERE pl.user_id = ?' : '';
  const params = userId ? [userId] : [];

  const totals = db.prepare(`
    SELECT
      COUNT(*) as total_calls,
      SUM(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 ELSE 0 END) as success_calls,
      SUM(CASE WHEN response_status IS NULL OR response_status >= 400 THEN 1 ELSE 0 END) as failed_calls,
      SUM(token_issued) as tokens_issued,
      AVG(response_time_ms) as avg_response_ms
    FROM playground_logs pl ${where}
  `).get(...params) as { total_calls: number; success_calls: number; failed_calls: number; tokens_issued: number; avg_response_ms: number | null };

  const byEndpoint = db.prepare(`
    SELECT endpoint_id, endpoint_title,
      COUNT(*) as count,
      SUM(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 ELSE 0 END) as success
    FROM playground_logs pl ${where}
    GROUP BY endpoint_id, endpoint_title
    ORDER BY count DESC
  `).all(...params) as { endpoint_id: string; endpoint_title: string; count: number; success: number }[];

  return { ...totals, by_endpoint: byEndpoint };
}
