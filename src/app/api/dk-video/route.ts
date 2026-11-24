import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 3600;

/** host video yang diizinkan (anti SSRF) */
const ALLOW = /^https?:\/\/durian\.whatbox\.ca[:/]/i;

/**
 * Proxy video MP4 Drakorku — streaming dengan dukungan Range,
 * header untuk diputar inline, dan cache kuat.
 */
export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u') || '';
  let target = '';
  try {
    target = Buffer.from(u, 'base64url').toString('utf8');
  } catch {
    return NextResponse.json({ error: 'param rusak' }, { status: 400 });
  }
  if (!ALLOW.test(target)) {
    return NextResponse.json({ error: 'host tidak diizinkan' }, { status: 400 });
  }

  const upstream: Record<string, string> = { 'User-Agent': 'Mozilla/5.0' };
  const range = req.headers.get('range');
  if (range) upstream.Range = range;

  let res: Response;
  try {
    res = await fetch(target, {
      headers: upstream,
      // @ts-expect-error opsi duplex untuk streaming body
      duplex: 'half',
      next: { revalidate: 3600 },
    });
  } catch {
    return NextResponse.json({ error: 'sumber tidak terjangkau' }, { status: 502 });
  }
  if (!res.ok && res.status !== 206) {
    return NextResponse.json({ error: `sumber ${res.status}` }, { status: 502 });
  }

  const headers = new Headers();
  for (const k of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
    const v = res.headers.get(k);
    if (v) headers.set(k, v);
  }
  if (!headers.has('content-type')) headers.set('content-type', 'video/mp4');
  headers.set('cache-control', 'public, max-age=86400, s-maxage=86400');
  headers.set('access-control-allow-origin', '*');

  return new NextResponse(res.body, { status: res.status, headers });
}
