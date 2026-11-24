import { NextRequest, NextResponse } from 'next/server';
import { getRsEpisodeVideo } from '@/lib/reelshort';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

/**
 * Proxy playlist HLS episode ReelShort:
 * - pilih kualitas SD (fallback LD),
 * - tulis-ulang URI segmen/varian lewat proxy kita (CORS + stabil),
 * - SARING segmen iklan otomatis (blok setelah EXT-X-DISCONTINUITY yang
 *   tidak mengikuti pola segmen utama) + buang penanda SCTE/DATERANGE.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { bookId: string; chapterId: string } },
) {
  const { bookId, chapterId } = params;
  const serial = Number(_req.nextUrl.searchParams.get('ep') || '1');
  const vid = await getRsEpisodeVideo(bookId, chapterId, serial).catch(() => null);
  if (!vid) {
    return NextResponse.json({ error: 'Episode tidak ditemukan' }, { status: 404 });
  }

  // coba SD dulu, fallback LD — dengan retry bila kena throttle
  let text: string | null = null;
  for (const url of [vid.sdUrl, vid.ldUrl]) {
    for (let t = 0; t < 2 && !text; t += 1) {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': UA, Referer: 'https://www.reelshort.com/' },
          next: { revalidate: 3600 },
        });
        if (res.ok) {
          const body = await res.text();
          if (/#EXTM3U/.test(body)) text = body;
        }
      } catch {
        /* retry */
      }
      if (!text) await new Promise((r2) => setTimeout(r2, 1000));
    }
    if (text) break;
  }
  if (!text) return NextResponse.json({ error: 'Stream tidak tersedia' }, { status: 502 });

  const base = (text.includes('h264-ordinary-sd') ? vid.sdUrl : vid.ldUrl).replace(/[^/]+$/, '');
  const lines = text.split('\n');

  // pola segmen utama (paling dominan) untuk deteksi segmen iklan
  const segRe = /^[^\s#].*\.(ts|m4s|mp4)(\?.*)?$/;
  const prefixes = new Map<string, number>();
  for (const l of lines) {
    const t = l.trim();
    if (segRe.test(t)) {
      const p = t.replace(/\d+\.(ts|m4s|mp4)(\?.*)?$/, '');
      prefixes.set(p, (prefixes.get(p) || 0) + 1);
    }
  }
  let mainPrefix = '';
  let max = 0;
  for (const [p, n] of prefixes) if (n > max) { max = n; mainPrefix = p; }

  const abs = (u: string) => (u.startsWith('http') ? u : base + u);
  const proxied = (u: string) =>
    `/api/rs-video/seg?u=${encodeURIComponent(Buffer.from(abs(u), 'utf-8').toString('base64url'))}`;

  const out: string[] = [];
  let dropNext = false; // sedang membuang EXTINF untuk segmen iklan
  for (const raw of lines) {
    const l = raw.trim();
    if (!l) { out.push(''); continue; }
    // buang penanda iklan
    if (/^#EXT-X-(DATERANGE|SCTE35|CUE)/i.test(l) || /^#ANVATO/i.test(l)) continue;
    if (/^#EXT-X-DISCONTINUITY\b/.test(l)) { out.push(l); continue; }
    if (/^#EXTINF/.test(l)) {
      // lihat baris URI berikutnya dulu
      dropNext = false;
      out.push(l);
      continue;
    }
    if (segRe.test(l)) {
      const p = l.replace(/\d+\.(ts|m4s|mp4)(\?.*)?$/, '');
      if (mainPrefix && p !== mainPrefix) {
        // segmen iklan: buang pasangan EXTINF terakhir
        if (out.length && /^#EXTINF/.test(out[out.length - 1])) out.pop();
        continue;
      }
      out.push(proxied(l));
      continue;
    }
    if (/^#EXT-X-STREAM-INF/.test(l)) { out.push(l); continue; }
    // varian playlist (master) atau baris URI lain
    if (!l.startsWith('#') && /\.(m3u8|m4s|mp4|ts)(\?.*)?$/.test(l)) {
      out.push(proxied(l));
      continue;
    }
    out.push(l);
  }

  return new NextResponse(out.join('\n'), {
    headers: {
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
