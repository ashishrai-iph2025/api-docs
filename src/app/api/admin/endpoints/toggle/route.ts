import { NextRequest, NextResponse } from 'next/server';
import { getContentData, writeContent } from '@/lib/content-store';
import { getAuthContext } from '@/lib/session';
import { logActivity } from '@/lib/db';

export async function PUT(req: NextRequest) {
  try {
    const { id, active } = await req.json();
    if (typeof id !== 'string' || typeof active !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
    }
    const data = getContentData();
    const endpoints = { ...data.endpoints };
    endpoints[id] = { ...endpoints[id], active };
    writeContent({ ...data, endpoints });

    const ctx = await getAuthContext(req);
    logActivity({
      user_id: ctx?.user.id,
      email: ctx?.user.email,
      action: active ? 'endpoint_enabled' : 'endpoint_disabled',
      resource: id,
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
      user_agent: req.headers.get('user-agent') ?? undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
