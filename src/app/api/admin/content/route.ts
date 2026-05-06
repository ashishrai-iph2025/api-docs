import { NextRequest, NextResponse } from 'next/server';
import { getContentData, writeContent, getEndpoints } from '@/lib/content-store';

export async function GET() {
  try {
    const data = getContentData();
    const endpoints = getEndpoints();
    return NextResponse.json({ ...data, _endpoints: endpoints });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error in GET /api/admin/content:', msg);
    return NextResponse.json({ error: `Failed to fetch content: ${msg}` }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('PUT /api/admin/content received:', JSON.stringify(body).substring(0, 200) + '...');
    writeContent(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error in PUT /api/admin/content:', msg, error);
    return NextResponse.json({ error: `Failed to save content: ${msg}` }, { status: 500 });
  }
}
