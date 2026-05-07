import { NextRequest, NextResponse } from 'next/server';
import { getContentData, writeContent } from '@/lib/content-store';
import { getAuthContext } from '@/lib/session';
import { logActivity } from '@/lib/db';

export async function PUT(req: NextRequest) {
  try {
    const { order } = await req.json();
    if (!Array.isArray(order) || !order.every((id) => typeof id === 'string')) {
      return NextResponse.json({ error: 'Invalid order array.' }, { status: 400 });
    }
    const data = getContentData();
    writeContent({ ...data, endpointOrder: order });

    const ctx = await getAuthContext(req);
    logActivity({
      user_id: ctx?.user.id,
      email: ctx?.user.email,
      action: 'endpoint_reordered',
      details: { count: order.length },
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
      user_agent: req.headers.get('user-agent') ?? undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
