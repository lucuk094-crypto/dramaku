import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ALLOWED_HOST_SUFFIX = '.farsunpteltd.com';

/**
 * Proksi gambar cover katalog — beberapa CDN memblokir berdasarkan Referer
 * atau diblokir pemblokir iklan di perangkat pengguna. Server mengambil
 * tanpa Referer lalu menyajikannya ulang dari domain kita.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('u') || '';
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return new NextResponse('url tidak valid', { status: 400 });
  }
  if (url.protocol !== 'https:' || !url.hostname.endsWith(ALLOWED_HOST_SUFFIX)) {
    return new NextResponse('tidak diizinkan', { status: 403 });
  }

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    cache: 'force-cache',
    signal: AbortSignal.timeout(10000),
  }).catch(() => null);
  if (!res || !res.ok) return new NextResponse('gagal mengambil gambar', { status: 502 });

  const type = res.headers.get('content-type');
  if (!type || !type.startsWith('image/')) return new NextResponse('bukan gambar', { status: 502 });

  const buf = await res.arrayBuffer();
  return new NextResponse(buf, {
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
    },
  });
}
