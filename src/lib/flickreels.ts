/**
 * DramaKu — lapisan data katalog platform saudara FlickReels (apiweb.flickreels.net).
 *
 * Dipakai untuk taksonomi lengkap yang tidak diekspos web melolo:
 *  - 126 tag Kategori & Karakter (Bahasa Indonesia, language_id=6)
 *  - daftar judul per tag, urut rilisan TERBARU (playlet_id menurun) = "Baru Tayang"
 *  - daftar chapter lengkap 1..N + status kunci (is_lock) untuk info episode
 *
 * Request ditandatangani: MD5(payload k=v terurut + "&signSalt=…") sebagai header `sign`.
 * Jembatan judul → slug melolo (agar kartu bisa masuk halaman tonton DramaKu).
 */
import { unstable_cache } from 'next/cache';
import { createHash } from 'node:crypto';
import { BASE as MELOLO_BASE } from './melolo';

const FR_BASE = 'https://apiweb.flickreels.net';
const FR_SALT = 'nW8GqjbdSYRI';
/** Bahasa Indonesia pada katalog FlickReels. */
export const FR_LANG_ID = 6;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/* ------------------------------------------------------------------ types */

export interface FrCategory {
  tag_id: number;
  name: string;
}

export interface FrPlaylet {
  playlet_id: number;
  title: string;
  cover: string | null;
  upload_num: number | null;
  introduce: string | null;
  tag_list: { id: string; name: string }[];
}

export interface FrChapter {
  chapter_id: string;
  chapter_num: number;
  is_lock: boolean;
  chapter_cover: string | null;
  chapter_title: string | null;
  duration: string | null;
}

export interface FrPage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/* ------------------------------------------------------------------ cache */

const cache = new Map<string, { exp: number; v: unknown }>();
function memo<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now()) return Promise.resolve(hit.v as T);
  return fn().then((v) => {
    cache.set(key, { exp: Date.now() + ttl, v });
    return v;
  });
}

/* ------------------------------------------------------------------ core */

async function frCallInner<T>(path: string, payload: Record<string, string | number>): Promise<T> {
  const sorted = Object.entries(payload)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const sign = createHash('md5').update(`${sorted}&signSalt=${FR_SALT}`).digest('hex');
  const res = await fetch(`${FR_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      sign,
      'Web-System': 'pc',
      'User-Agent': UA,
    },
    body: JSON.stringify(payload),
    next: { revalidate: 1800 },
    cache: 'force-cache',
  });
  if (!res.ok) throw new Error(`FR ${path} HTTP ${res.status}`);
  const json = (await res.json()) as { status_code: number; msg?: string; data?: T };
  if (json.status_code !== 1 || json.data == null) throw new Error(`FR ${path}: ${json.msg || 'gagal'}`);
  return json.data;
}

/* ------------------------------------------------------------------ kategori */

/** 126 tag Kategori + Karakter (Bahasa Indonesia). Stabil — cache 24 jam. */

const frCallCached = unstable_cache(frCallInner as any, ['fr:frCall'], { revalidate: 1800 });

async function frCall<T>(path: string, payload: Record<string, string | number>): Promise<T> {
  return (await frCallCached(path, payload)) as T;
}
export function getFrCategories(): Promise<FrCategory[]> {
  return memo('fr:cats', 24 * 3600e3, async () => {
    const data = await frCall<FrCategory[]>('/web/playlet_category/getCategoryList', {
      language_id: FR_LANG_ID,
    });
    return (data || []).filter((c) => c.tag_id !== 0);
  });
}

/**
 * Daftar judul per tag, urut rilisan terbaru. category_id=0 = semua.
 * Ini mesin "Baru Tayang" per kategori (playlet_id menurun = terbaru).
 */
export function getFrPlaylets(
  categoryId: number,
  page = 1,
  pageSize = 24,
): Promise<FrPage<FrPlaylet>> {
  return memo(`fr:list:${categoryId}:${page}:${pageSize}`, 1800e3, async () => {
    const data = await frCall<{ data: FrPlaylet[]; page_info: { total: number } }>(
      '/web/playlet_category/getPlayletList',
      { language_id: FR_LANG_ID, category_id: categoryId, page, page_size: pageSize },
    );
    return {
      items: data.data || [],
      total: data.page_info?.total ?? 0,
      page,
      pageSize,
    };
  });
}

export interface FrDetail {
  playlet_id: number;
  title: string;
  cover: string | null;
  upload_num: number | null;
  introduce: string | null;
  tag_name: { id: string; name: string }[];
  upload_date: string | null;
  finish_state: number | null;
  chapters: FrChapter[];
}

/** Detail judul + SEMUA chapter 1..N + status kunci (satu panggilan). */
export function getFrDetail(playletId: number): Promise<FrDetail> {
  return memo(`fr:ch:${playletId}`, 1800e3, async () => {
    const d = await frCall<{
      playlet_id: number;
      title: string;
      cover: string;
      upload_num: string | number;
      introduce: string;
      tag_name: { id: string; name: string }[];
      upload_date: string;
      finish_state: number;
      list: FrChapter[];
    }>('/web/playlet/chapterList', {
      language_id: FR_LANG_ID,
      playlet_id: playletId,
      page: 1,
      page_size: 200,
    });
    return {
      playlet_id: d.playlet_id,
      title: d.title,
      cover: d.cover ?? null,
      upload_num: d.upload_num != null ? Number(d.upload_num) : null,
      introduce: d.introduce ?? null,
      tag_name: d.tag_name || [],
      upload_date: d.upload_date ?? null,
      finish_state: d.finish_state ?? null,
      chapters: (d.list || []).map((c) => ({ ...c, is_lock: !!c.is_lock })),
    };
  });
}

/* ------------------------------------------------------------------ jembatan melolo */

const slugCache = new Map<string, string | null>();

function slugifyId(title: string): string {
  return title
    .toLowerCase()
    .replace(/\(dubbing\)|\[versi suara dubbing\]/gi, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Cari padanan judul di katalog melolo → slug untuk /series/{slug}.
 * Urutan: slugifikasi judul → pencarian nama persis. Hasil dimemo per judul.
 */
/* — pencocokan fuzzy lewat sitemap melolo (12 ribu+ judul, cache 12 jam) — */
let meloloSlugsCache: { slugs: string[]; at: number } | null = null;
async function meloloSitemapSlugs(): Promise<string[]> {
  const TTL = 12 * 3600 * 1000;
  if (meloloSlugsCache && Date.now() - meloloSlugsCache.at < TTL) return meloloSlugsCache.slugs;
  try {
    const txt = await fetch('https://melolo.com/sitemap/movie.xml', {
      next: { revalidate: 43200 },
      signal: AbortSignal.timeout(20000),
    }).then((r) => r.text());
    const slugs: string[] = [];
    for (const chunk of txt.split('<loc>').slice(1)) {
      const url = chunk.split('</loc>')[0];
      const mm = url.trim().match(/\/(?:dramas|movies|series)\/([a-z0-9-]+)\/?$/);
      if (mm) slugs.push(mm[1]);
    }
    meloloSlugsCache = { slugs: Array.from(new Set(slugs)), at: Date.now() };
    return meloloSlugsCache.slugs;
  } catch {
    return [];
  }
}
function normSlugKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}
function trigrams(s: string): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i + 3 <= s.length; i++) out.add(s.slice(i, i + 3));
  return out;
}
function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / Math.max(1, a.size + b.size - inter);
}

async function bridgeToMeloloInner(
  title: string,
): Promise<{ slug: string; name: string } | null> {
  const key = title.trim().toLowerCase();
  if (slugCache.has(key)) return slugCache.get(key) ? { slug: slugCache.get(key)!, name: title } : null;

  // 1) slug langsung (sebagian judul = slug melolo) — id dulu, fallback en
  const direct = slugifyId(title);
  if (direct) {
    for (const L of ['id', 'en']) {
      try {
        const res = await fetch(
          `${MELOLO_BASE}/api/series/getSeriesBySlug?language=${L}&series_slug=${direct}&pageType=detail&episode_id=1`,
          { headers: { 'User-Agent': UA }, next: { revalidate: 3600 } },
        );
        const json = await res.json();
        const d = Array.isArray(json?.data) ? json.data[0] : json?.data;
        if (d?.series_slug) {
          slugCache.set(key, d.series_slug);
          return { slug: d.series_slug, name: d.name || title };
        }
      } catch {
        /* lanjut ke bahasa/cara berikutnya */
      }
    }
  }

  // 2) pencarian nama persis
  try {
    const q = encodeURIComponent(title.slice(0, 24));
    const res = await fetch(`${MELOLO_BASE}/api/series/searchSeries?language=id&query=${q}&pn=1&ps=8`, {
      headers: { 'User-Agent': UA },
      next: { revalidate: 3600 },
    });
    const json = await res.json();
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const exact = (json?.data || []).find(
      (x: { name: string; series_slug: string }) => norm(x.name) === norm(title),
    );
    if (exact?.series_slug) {
      slugCache.set(key, exact.series_slug);
      return { slug: exact.series_slug, name: exact.name };
    }
  } catch {
    /* diabaikan */
  }

  // 3) fuzzy lewat sitemap (judul kembar dengan slug sedikit beda)
  try {
    const target = normSlugKey(title);
    if (target.length >= 6) {
      const slugs = await meloloSitemapSlugs();
      const tg = trigrams(target);
      let best: string | null = null;
      let bestScore = 0;
      for (const slug of slugs) {
        const n = normSlugKey(slug);
        if (n === target) {
          best = slug;
          bestScore = 1;
          break;
        }
        if (Math.abs(n.length - target.length) > Math.max(8, target.length * 0.34)) continue;
        const score = jaccard(tg, trigrams(n));
        if (score > bestScore) {
          bestScore = score;
          best = slug;
        }
      }
      if (best && bestScore >= 0.62) {
        slugCache.set(key, best);
        return { slug: best, name: title };
      }
    }
  } catch {
    /* diabaikan */
  }

  slugCache.set(key, null);
  return null;
}

/** Jembatan massal — pool kecil + jeda (sumber membatasi ledakan paralel). */

const bridgeToMeloloCached = unstable_cache(bridgeToMeloloInner, ['fr:bridgeMelolo'], { revalidate: 3600 });

export async function bridgeToMelolo(
  title: string,
): Promise<{ slug: string; name: string } | null> {
  return (await bridgeToMeloloCached(title)) as { slug: string; name: string } | null;
}
export async function bridgeMany(
  titles: string[],
): Promise<(Map<string, { slug: string; name: string }>)> {
  const out = new Map<string, { slug: string; name: string }>();
  const queue = [...titles];
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const worker = async () => {
    while (queue.length) {
      const t = queue.shift()!;
      const hit = await bridgeToMelolo(t);
      if (hit) out.set(t, hit);
      await sleep(100);
    }
  };
  await Promise.all(Array.from({ length: 3 }, worker));
  return out;
}

/** Pencarian kata kunci lintas katalog (untuk istilah tanpa tag khusus, mis. "amnesia"). */
export function frSearch(keyword: string, page = 1, pageSize = 24): Promise<FrPage<FrPlaylet>> {
  return memo(`fr:q:${keyword}:${page}:${pageSize}`, 1800e3, async () => {
    const data = await frCall<FrPlaylet[]>('/web/user_search/search', {
      language_id: FR_LANG_ID,
      keyword,
      page,
      page_size: pageSize,
    });
    return { items: data || [], total: (data || []).length, page, pageSize };
  });
}
