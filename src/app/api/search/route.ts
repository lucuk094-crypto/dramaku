import { NextRequest, NextResponse } from 'next/server';
import { search } from '@/lib/melolo';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = (searchParams.get('q') || '').trim();
  const type = searchParams.get('type') || 'series';
  const page = Number(searchParams.get('page') || '1');
  const size = Math.min(24, Number(searchParams.get('size') || '12'));

  if (!q) {
    return NextResponse.json({ query: q, type, page, page_size: size, total: 0, total_pages: 0, type_counts: {}, items: [] });
  }

  try {
    const result = await search(q, type, page, size);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Gagal mengambil data pencarian', detail: String(err?.message || err) },
      { status: 502 },
    );
  }
}
