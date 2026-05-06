import { NextRequest, NextResponse } from 'next/server';
import { getContentData, writeContent } from '@/lib/content-store';

export async function PUT(req: NextRequest) {
  try {
    const { order } = await req.json();
    if (!Array.isArray(order) || !order.every((id) => typeof id === 'string')) {
      return NextResponse.json({ error: 'Invalid order array.' }, { status: 400 });
    }
    const data = getContentData();
    writeContent({ ...data, endpointOrder: order });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
