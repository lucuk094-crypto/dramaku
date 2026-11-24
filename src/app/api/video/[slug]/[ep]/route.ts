/**
 * Proxy streaming video — jantung pemutar DramaKu.
 *
 * URL CDN Melolo (v.melolo.com) mewajibkan `Referer: https://melolo.com/`
 * dan URL sign-nya hanya berlaku ~300 detik. Browser tidak bisa memalsukan
 * Referer, jadi server meneruskan (proxy) stream dengan:
 *   1. ambil URL sign segar dari API Melolo (cache 240 dtk per episode),
 *   2. teruskan header `Range` supaya seek/lanjut-nonton tetap jalan,
 *   3. alirkan (stream) byte video ke browser tanpa buffering penuh.
 */
import { NextRequest } from 'next/server';
import { getSignedStream } from '@/lib/melolo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
/** Streaming episode penuh boleh lama — minta alokasi maksimum Vercel. */
export const maxDuration = 300;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/** Cache URL sign per instance serverless (TTL aman 240 dtk < 300 dtk masa berlaku). */
const signCache = new Map<string, { url: string; expiresAt: number }>();

async function freshSignedUrl(slug: string, ep: number): Promise<string> {
  const key = `${slug}:${ep}`;
  const hit = signCache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.url;

  const stream = await getSignedStream(slug, ep);
  signCache.set(key, { url: stream.stream_url, expiresAt: Date.now() + 240_000 });
  return stream.stream_url;
}

export async function GET(req: NextRequest, ctx: { params: { slug: string; ep: string } }) {
  const slug = String(ctx.params.slug || '').trim();
  const ep = Math.max(1, Number.parseInt(ctx.params.ep, 10) || 1);

  if (!/^[a-z0-9-]+$/i.test(slug)) {
    return new Response(JSON.stringify({ error: 'Slug tidak valid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const streamUrl = await freshSignedUrl(slug, ep);

    const headers = new Headers();
    headers.set('Referer', 'https://melolo.com/');
    headers.set('User-Agent', UA);
    headers.set('Accept', '*/*');
    const range = req.headers.get('range');
    if (range) headers.set('Range', range);

    let upstream = await fetch(streamUrl, { headers, cache: 'no-store' });

    // sign bisa kedaluwarsa lebih cepat — coba sekali lagi dengan URL baru
    if (!upstream.ok && upstream.status !== 206) {
      signCache.delete(`${slug}:${ep}`);
      const retryUrl = await freshSignedUrl(slug, ep);
      headers.set('Referer', 'https://melolo.com/');
      upstream = await fetch(retryUrl, { headers, cache: 'no-store' });
    }

    if (!upstream.ok && upstream.status !== 206) {
      return new Response(JSON.stringify({ error: `Upstream ${upstream.status}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const respHeaders = new Headers();
    for (const name of [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'etag',
      'last-modified',
    ]) {
      const value = upstream.headers.get(name);
      if (value) respHeaders.set(name, value);
    }
    respHeaders.set('Cache-Control', 'no-store');
    respHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(upstream.body, {
      status: upstream.status,
      headers: respHeaders,
    });
  } catch (err: any) {
    const status = err?.status === 404 ? 404 : 502;
    return new Response(
      JSON.stringify({ error: err?.message || 'Gagal memuat stream', episode: ep }),
      { status, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
