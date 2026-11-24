import { NextRequest, NextResponse } from 'next/server';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

/**
 * Proxy segmen HLS ReelShort (ts/m4s) — teruskan header Range, cache panjang.
 */
export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u');
  if (!u) return NextResponse.json({ error: 'u wajib' }, { status: 400 });

  let url: string;
  try {
    url = Buffer.from(u, 'base64url').toString('utf-8');
  } catch {
    return NextResponse.json({ error: 'u tidak valid' }, { status: 400 });
  }
  if (!/^https:\/\/[a-z0-9.-]*crazymaplestudios\.com\//i.test(url)) {
    return NextResponse.json({ error: 'host tidak diizinkan' }, { status: 403 });
  }

  const headers: Record<string, string> = {
    'User-Agent': UA,
    Referer: 'https://www.reelshort.com/',
  };
  const range = req.headers.get('range');
  if (range) headers.Range = range;

  const res = await fetch(url, { headers, next: { revalidate: 86400 } });
  if (!res.ok && res.status !== 206) {
    return NextResponse.json({ error: `upstream ${res.status}` }, { status: 502 });
  }

  const outHeaders = new Headers({
    'Content-Type': res.headers.get('Content-Type') || 'video/MP2T',
    'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    'Access-Control-Allow-Origin': '*',
    'Accept-Ranges': 'bytes',
  });
  const cl = res.headers.get('Content-Length');
  if (cl) outHeaders.set('Content-Length', cl);
  const cr = res.headers.get('Content-Range');
  if (cr) outHeaders.set('Content-Range', cr);

  return new NextResponse(res.body, { status: res.status, headers: outHeaders });
}
