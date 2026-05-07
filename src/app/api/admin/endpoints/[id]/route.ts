import { NextRequest, NextResponse } from 'next/server';
import { getContentData, writeContent } from '@/lib/content-store';
import { getAuthContext } from '@/lib/session';
import { logActivity } from '@/lib/db';
import type { Endpoint } from '@/data/types';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body: Partial<Endpoint> = await req.json();
    const data = getContentData();
    const existing = data.endpoints?.[id] ?? {};
    writeContent({ ...data, endpoints: { ...data.endpoints, [id]: { ...existing, ...body, id } } });

    const ctx = await getAuthContext(req);
    logActivity({
      user_id: ctx?.user.id,
      email: ctx?.user.email,
      action: 'endpoint_updated',
      resource: id,
      details: { title: (body as Endpoint).title ?? id },
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
      user_agent: req.headers.get('user-agent') ?? undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const data = getContentData();
    const endpoints = { ...data.endpoints };
    delete endpoints[id];
    const order = (data.endpointOrder ?? []).filter((eid) => eid !== id);
    writeContent({ ...data, endpoints, endpointOrder: order });

    const ctx = await getAuthContext(req);
    logActivity({
      user_id: ctx?.user.id,
      email: ctx?.user.email,
      action: 'endpoint_deleted',
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
