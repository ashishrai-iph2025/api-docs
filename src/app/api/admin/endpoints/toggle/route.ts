import { NextRequest, NextResponse } from 'next/server';
import { getContentData, writeContent } from '@/lib/content-store';

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
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
