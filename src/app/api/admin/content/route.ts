import { NextRequest, NextResponse } from 'next/server';
import { getContentData, writeContent, getEndpoints } from '@/lib/content-store';
import { getAuthContext } from '@/lib/session';
import { logActivity } from '@/lib/db';

export async function GET() {
  try {
    const data      = getContentData();
    const endpoints = getEndpoints();
    return NextResponse.json({ ...data, _endpoints: endpoints });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Failed to fetch content: ${msg}` }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    writeContent(body);

    const ctx = await getAuthContext(req);
    logActivity({
      user_id: ctx?.user.id,
      email: ctx?.user.email,
      action: 'content_updated',
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
      user_agent: req.headers.get('user-agent') ?? undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Failed to save content: ${msg}` }, { status: 500 });
  }
}
