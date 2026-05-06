import { NextRequest, NextResponse } from 'next/server';
import { getContentData, writeContent } from '@/lib/content-store';
import type { Endpoint } from '@/data/types';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body: Partial<Endpoint> = await req.json();

    const data = getContentData();
    const existing = data.endpoints?.[id] ?? {};

    writeContent({
      ...data,
      endpoints: {
        ...data.endpoints,
        [id]: { ...existing, ...body, id },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('PUT /api/admin/endpoints/[id] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = getContentData();
    const endpoints = { ...data.endpoints };
    delete endpoints[id];
    const order = (data.endpointOrder ?? []).filter((eid) => eid !== id);
    writeContent({ ...data, endpoints, endpointOrder: order });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
