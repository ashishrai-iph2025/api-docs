import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/session';
import { getContentData } from '@/lib/content-store';
import { createPlaygroundToken, logActivity, logPlaygroundCall } from '@/lib/db';
import https from 'https';

export const dynamic = 'force-dynamic';

// Node.js fetch with SSL-relaxed agent for internal/self-signed certs
function fetchWithAgent(url: string, options: RequestInit): Promise<Response> {
  const agent = new https.Agent({ rejectUnauthorized: false });
  // @ts-expect-error node-only option
  return fetch(url, { ...options, agent });
}

async function callLoginApi(url: string, body: string): Promise<{ ok: boolean; status: number; text: string }> {
  const opts: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  };
  // First attempt: standard fetch
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } catch (firstErr) {
    // Second attempt: relax SSL (handles self-signed certs)
    try {
      const res = await fetchWithAgent(url, opts);
      const text = await res.text();
      return { ok: res.ok, status: res.status, text };
    } catch (secondErr) {
      const cause = secondErr instanceof Error ? secondErr.message : String(secondErr);
      throw new Error(`Cannot reach ${url} — ${cause}`);
    }
  }
}

function cleanTokenCandidate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const token = value.trim().replace(/^Bearer\s+/i, '');
  if (token.length <= 10) return null;
  if (/\s/.test(token)) return null;
  return token;
}

function extractToken(value: unknown, depth = 0): string | null {
  const direct = cleanTokenCandidate(value);
  if (direct) return direct;
  if (!value || typeof value !== 'object' || depth > 4) return null;

  const record = value as Record<string, unknown>;
  const fields = [
    'token',
    'access_token',
    'accessToken',
    'Token',
    'jwt',
    'response',
    'data',
    'result',
  ];

  for (const field of fields) {
    const found = extractToken(record[field], depth + 1);
    if (found) return found;
  }

  for (const nested of Object.values(record)) {
    const found = extractToken(nested, depth + 1);
    if (found) return found;
  }

  return null;
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const { apiUsername, apiPassword } = body as { apiUsername: string; apiPassword: string };
  if (!apiUsername || !apiPassword) {
    return NextResponse.json({ error: 'API username and password are required.' }, { status: 400 });
  }

  const content = getContentData();
  const baseUrl   = content.login?.baseUrl   ?? '';
  const loginPath = content.login?.loginPath ?? '/Login';

  if (!baseUrl) {
    return NextResponse.json({
      error: 'API base URL is not configured. Go to Admin → Sections & Text → Login and set the Base URL.',
    }, { status: 500 });
  }

  const loginUrl = `${baseUrl}${loginPath}`;
  const start = Date.now();

  try {
    const { ok, status, text } = await callLoginApi(
      loginUrl,
      JSON.stringify({ username: apiUsername, password: apiPassword }),
    );
    const elapsed = Date.now() - start;

    let loginData: unknown = null;
    try { loginData = JSON.parse(text); } catch { /* plain text response */ }

    if (!ok) {
      logActivity({
        user_id: ctx.user.id,
        email: ctx.user.email,
        action: 'playground_token_failed',
        resource: loginUrl,
        details: { apiUsername, status, responseMs: elapsed },
      });
      return NextResponse.json({
        success: false,
        status,
        loginUrl,
        message: loginData ?? text,
        responseTimeMs: elapsed,
        error: `Login endpoint returned HTTP ${status}.`,
      });
    }

    const token = extractToken(loginData) ?? extractToken(text);

    if (!token && !loginData) {
      return NextResponse.json({
        success: false,
        status,
        loginUrl,
        responseTimeMs: elapsed,
        error: 'Login succeeded but response is not JSON.',
        rawResponse: text.slice(0, 500),
      });
    }

    // Find the JWT — check every common field name; the target API uses "response"
    if (!token) {
      return NextResponse.json({
        success: false,
        status,
        loginUrl,
        responseTimeMs: elapsed,
        error: 'Login succeeded but no token field found in the response. Check the raw response below.',
        rawResponse: loginData,
      });
    }

    const storedToken = createPlaygroundToken({
      user_id: ctx.user.id,
      api_username: apiUsername,
      login_url: loginUrl,
      token,
      response_status: status,
      response_time_ms: elapsed,
    });

    logPlaygroundCall({
      user_id: ctx.user.id,
      token_id: storedToken.id,
      endpoint_id: 'login',
      endpoint_title: 'Login',
      method: 'POST',
      path: loginPath,
      api_username: apiUsername,
      request_body: JSON.stringify({ username: apiUsername, password: '********' }),
      response_status: status,
      response_time_ms: elapsed,
      response_preview: 'Token generated successfully.',
      token_issued: true,
    });

    logActivity({
      user_id: ctx.user.id,
      email: ctx.user.email,
      action: 'playground_token_issued',
      resource: loginUrl,
      details: { apiUsername, responseMs: elapsed, tokenId: storedToken.id },
    });

    return NextResponse.json({
      success: true,
      token,
      apiUsername,
      responseTimeMs: elapsed,
      generatedAt: new Date().toISOString(),
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      success: false,
      loginUrl,
      error: msg,
    }, { status: 502 });
  }
}
