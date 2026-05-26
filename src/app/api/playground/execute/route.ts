import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/session';
import { getActiveEndpoints, getContentData } from '@/lib/content-store';
import { getPlaygroundTokenByValue, logPlaygroundCall } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const { endpointId, token, apiUsername, requestBody } = body as {
    endpointId: string;
    token: string;
    apiUsername?: string;
    requestBody?: string;
  };

  if (!endpointId) return NextResponse.json({ error: 'endpointId required' }, { status: 400 });
  if (!token) return NextResponse.json({ error: 'token required — generate a token first.' }, { status: 400 });

  const endpoints = getActiveEndpoints();
  const endpoint = endpoints.find(e => e.id === endpointId);
  if (!endpoint) return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });

  const content = getContentData();
  const baseUrl = content.login?.baseUrl ?? '';
  if (!baseUrl) return NextResponse.json({ error: 'API base URL not configured.' }, { status: 500 });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const start = Date.now();
  let responseStatus: number | undefined;
  let responseText = '';
  let success = false;

  try {
    const fetchOpts: RequestInit = { method: endpoint.method, headers };
    if (endpoint.method !== 'GET') {
      fetchOpts.body = requestBody || '{}';
    }
    const apiRes = await fetch(`${baseUrl}${endpoint.path}`, fetchOpts);
    responseStatus = apiRes.status;
    responseText = await apiRes.text();
    success = apiRes.status >= 200 && apiRes.status < 300;
  } catch (err) {
    responseText = err instanceof Error ? err.message : String(err);
  }

  const elapsed = Date.now() - start;
  const storedToken = getPlaygroundTokenByValue(token);

  logPlaygroundCall({
    user_id: ctx.user.id,
    token_id: storedToken?.id,
    endpoint_id: endpointId,
    endpoint_title: endpoint.title,
    method: endpoint.method,
    path: endpoint.path,
    api_username: apiUsername,
    request_body: requestBody,
    response_status: responseStatus,
    response_time_ms: elapsed,
    response_preview: responseText.slice(0, 1000),
    token_issued: false,
  });

  let parsedResponse: unknown = responseText;
  try { parsedResponse = JSON.parse(responseText); } catch { /* keep as string */ }

  return NextResponse.json({
    success,
    status: responseStatus,
    response: parsedResponse,
    responseTimeMs: elapsed,
  });
}
