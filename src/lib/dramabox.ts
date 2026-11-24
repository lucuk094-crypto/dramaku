/**
 * DramaBox — katalog drama pendek global (API theresav.eu / Blckrosé).
 *
 * Endpoint:
 *  - home                          → kurasi featured + baris
 *  - browse?genre={id}&page={n}    → katalog 12/halaman (50 genre, ID dari categories)
 *  - categories                    → 50 genre (id/name/slug)
 *  - detail?bookId=                → buku + daftar episode (free/locked + mp4/m3u8 utk yg free)
 *  - search?query=                 → pencarian (20/hal)
 *  - stream?bookId=&episode=       → 1 episode (mp4/m3u8 penuh utk free; cuplikan 15 dtk utk locked)
 *
 * Strategi "ALL UNLOCK" (tanpa membobol akses berbayar):
 *  1. episode `free`            → stream penuh DramaBox (mp4 720p, langsung diputar)
 *  2. episode `locked`          → cari versi gratis:
 *     a. versi lengkap di katalog tonton kita (jembatan judul → melolo) bila
 *        jumlah episode di sana mencakup nomor ini;
 *     b. unggahan resmi DramaBox di YouTube (episode penuh per nomor);
 *  3. bila tidak ada sumber gratis → badge "PREMIUM" + cuplikan 15 detik.
 *
 * Catatan kuota: API membatasi ~20 request/menit — semua panggilan di-cache
 * agresif lewat Next fetch cache (revalidate jam-an).
 */

const API = 'https://api.theresav.eu/api/drama/dramabox';
const API_KEY = 'MsqXG';

/* ───────────────────────── tipe data ───────────────────────── */

export interface DbBook {
  bookId: string;
  title: string;
  titleEn: string;
  cover: string;
  introduction: string;
  tags: string[];
  genres: string[];
  chapterCount: number;
  viewCount: number;
  followCount: number;
  rating: number | null;
  author: string;
  language: string;
}

export interface DbEpisode {
  chapterId: string;
  index: number;
  indexStr: string;
  name: string;
  free: boolean;
  duration: number;
  price: number;
  cover: string;
  mp4: string;
  m3u8: string;
}

export interface DbDetail {
  book: DbBook;
  totalEpisodes: number;
  freeEpisodes: number;
  lockedEpisodes: number;
  episodes: DbEpisode[];
}

export interface DbGenre {
  id: number;
  name: string;
  slug: string;
}

export interface DbBrowseResult {
  genre: number;
  genreName: string;
  page: number;
  totalPages: number;
  count: number;
  books: DbBook[];
}

export interface DbStreamResult {
  bookId: string;
  title: string;
  chapterId: string;
  index: number;
  free: boolean;
  locked: boolean;
  note: string;
  duration: number;
  format: string;
  url: string;
  mp4: string;
  m3u8: string;
}

/** Sumber pemutar hasil resolusi "all unlock". */
export type DbSourceKind = 'db' | 'melolo' | 'youtube' | 'preview';

export interface DbEpisodePlan {
  n: number;
  free: boolean;
  kind: DbSourceKind;
  /** id video YouTube bila kind='youtube' */
  videoId?: string;
  /** slug melolo bila kind='melolo' */
  slug?: string;
}

/* ───────────────────────── util ───────────────────────── */

async function dbFetch<T>(path: string, revalidate = 3600): Promise<T> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch(`${API}${path}`, {
        headers: { 'x-apikey': API_KEY, 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate },
      });
      if (!res.ok) {
        const err: any = new Error(`dramabox ${res.status}`);
        err.status = res.status;
        throw err;
      }
      const json = (await res.json()) as { status: boolean; result: T };
      if (!json?.status) throw new Error('dramabox result gagal');
      return json.result;
    } catch (e) {
      lastErr = e;
      if (attempt === 0) await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('dramabox gagal');
}

/* ───────────────────────── katalog ───────────────────────── */

export function dbCategories(): Promise<{ total: number; genres: DbGenre[] }> {
  return dbFetch(`/categories`, 86400);
}

export function dbBrowse(genreId = 0, page = 1): Promise<DbBrowseResult> {
  const g = genreId > 0 ? `genre=${genreId}&` : '';
  return dbFetch(`/browse?${g}page=${page}`, 3600);
}

export function dbHome(): Promise<{
  featured: DbBook[];
  rows: { id: number; title: string; style: string; books: DbBook[] }[];
}> {
  return dbFetch(`/home`, 3600);
}

export function dbDetail(bookId: string): Promise<DbDetail> {
  return dbFetch(`/detail?bookId=${encodeURIComponent(bookId)}`, 3600);
}

export function dbSearch(query: string, page = 1): Promise<{
  query: string; page: number; totalPages: number; total: number; count: number; books: DbBook[];
}> {
  return dbFetch(`/search?query=${encodeURIComponent(query)}&page=${page}`, 3600);
}

export function dbStream(bookId: string, episode: number): Promise<DbStreamResult> {
  // URL stream bertanda tangan (~1 hari) — cache pendek agar tidak kedaluwarsa lama
  return dbFetch(`/stream?bookId=${encodeURIComponent(bookId)}&episode=${episode}`, 1800);
}

/* ─────────────────── jembatan ke katalog tonton (melolo) ─────────────────── */

async function meloloAvailable(slug: string): Promise<number> {
  try {
    const { getSeries } = await import('@/lib/melolo');
    const d = await getSeries(slug);
    return d.availableCount || 0;
  } catch {
    return 0;
  }
}

/* ─────────────────── pencocokan YouTube resmi (best-effort) ─────────────────── */

interface YtVideo { id: string; title: string; channel: string }

/** Pencarian YouTube lewat endpoint internal (INNERTUBE) — lebih andal dari scraping HTML. */
async function ytInnertubeSearch(query: string): Promise<YtVideo[]> {
  const UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
  try {
    const keyPage = await fetch('https://www.youtube.com/results?search_query=dramabox', {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(15000),
    });
    const html = await keyPage.text();
    const key = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
    const ver = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)?.[1] || '2.20261123.00.00';
    if (!key) return [];

    const res = await fetch(`https://www.youtube.com/youtubei/v1/search?key=${key}&prettyPrint=false`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
      body: JSON.stringify({ context: { client: { clientName: 'WEB', clientVersion: ver } }, query }),
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(15000),
    });
    const raw = await res.text();

    const out: YtVideo[] = [];
    const blocks = raw.split('"videoRenderer":{').slice(1);
    for (const b of blocks) {
      const win = b.slice(0, 3200);
      const id = win.match(/^"videoId":"([\w-]{11})"/)?.[1];
      const tm = win.match(/"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/);
      const cm = win.match(/"(?:ownerText|longBylineText)":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/);
      if (!id || !tm) continue;
      let title = tm[1];
      try { title = JSON.parse(`"${title}"`); } catch { /* apa adanya */ }
      let channel = cm?.[1] || '';
      try { channel = JSON.parse(`"${channel}"`); } catch { /* apa adanya */ }
      out.push({ id, title, channel });
    }
    return out;
  } catch {
    return [];
  }
}

function episodeNumberFrom(text: string): number | null {
  const m =
    text.match(/(?:episode|eps?\.?|#)\s*0*(\d{1,3})/i) ||
    text.match(/第\s*(\d{1,3})\s*[集话]/);
  return m ? Number(m[1]) : null;
}

/**
 * Petakan nomor episode → id video YouTube dari kanal resmi DramaBox.
 * Best-effort: satu pencarian per judul, hasil di-cache 6 jam.
 */
export async function ytEpisodeMap(title: string): Promise<Record<number, string>> {
  const map: Record<number, string> = {};
  const vids = await ytInnertubeSearch(`${title} episode DramaBox`);
  const reOfficial = /drama\s*box/i;
  for (const v of vids) {
    if (!reOfficial.test(v.channel)) continue; // hanya kanal resmi
    const n = episodeNumberFrom(v.title);
    if (n && !map[n]) map[n] = v.id;
  }
  return map;
}

/* ─────────────────── resolusi "all unlock" ─────────────────── */

export interface DbResolution {
  detail: DbDetail;
  total: number;
  openCount: number;
  /** versi lengkap di katalog tonton kita (bila judulnya kembar) */
  meloloSlug: string | null;
  meloloTotal: number;
  /** nomor episode → id video YouTube resmi */
  yt: Record<number, string>;
  plans: DbEpisodePlan[];
}

/**
 * Hitung sumber pemutar terbaik untuk SETIAP episode (dipakai grid & halaman tonton).
 * Panggilan berat di-cache; aman dipanggil berulang.
 */
export async function resolveDbSources(bookId: string): Promise<DbResolution> {
  const detail = await dbDetail(bookId);
  const total = detail.totalEpisodes || detail.episodes.length;

  // 1) jembatan judul → katalog tonton (melolo)
  let meloloSlug: string | null = null;
  let meloloTotal = 0;
  try {
    const { bridgeToMelolo } = await import('@/lib/flickreels');
    const hit = await bridgeToMelolo(detail.book.title);
    if (hit?.slug) {
      meloloSlug = hit.slug;
      meloloTotal = await meloloAvailable(hit.slug);
    }
  } catch {
    /* tanpa jembatan */
  }

  // 2) unggahan resmi YouTube (hanya bila jembatan tidak menutup semua)
  let yt: Record<number, string> = {};
  const lockedN = detail.episodes.filter((e) => !e.free).map((e) => e.index);
  const coveredByMelolo = lockedN.filter((n) => meloloSlug && n <= meloloTotal).length;
  if (lockedN.length && coveredByMelolo < lockedN.length) {
    yt = await ytEpisodeMap(detail.book.title);
  }

  // 3) susun rencana per episode
  const plans: DbEpisodePlan[] = detail.episodes.map((e) => {
    if (e.free) return { n: e.index, free: true, kind: 'db' };
    if (meloloSlug && e.index <= meloloTotal) return { n: e.index, free: false, kind: 'melolo', slug: meloloSlug };
    if (yt[e.index]) return { n: e.index, free: false, kind: 'youtube', videoId: yt[e.index] };
    return { n: e.index, free: false, kind: 'preview' };
  });

  // episode yang tidak ada di daftar (jaga-jaga) tetap ditampilkan sebagai preview
  for (let n = plans.length + 1; n <= total; n += 1) plans.push({ n, free: false, kind: 'preview' });

  const openCount = plans.filter((p) => p.kind !== 'preview').length;
  return { detail, total, openCount, meloloSlug, meloloTotal, yt, plans };
}

/**
 * Ambil URL putar final untuk satu episode (dipanggil halaman tonton).
 *  - 'db'      → mp4 penuh dari stream API
 *  - 'melolo'  → mp4 signed katalog tonton
 *  - 'youtube' → id video
 *  - 'preview' → mp4 cuplikan 15 detik
 */
export async function resolveDbEpisode(
  bookId: string,
  n: number,
): Promise<{ kind: DbSourceKind; url?: string; videoId?: string; note: string; total: number; title: string; cover: string }> {
  const r = await resolveDbSources(bookId);
  const plan = r.plans.find((p) => p.n === n) || { n, free: false, kind: 'preview' as const };
  const book = r.detail.book;
  const base = { total: r.total, title: book.title, cover: book.cover };

  if (plan.kind === 'db') {
    const s = await dbStream(bookId, n);
    return { kind: 'db', url: s.mp4 || s.url, note: 'Streaming penuh.', ...base };
  }
  if (plan.kind === 'melolo' && plan.slug) {
    try {
      const { getSignedStream } = await import('@/lib/melolo');
      const s = await getSignedStream(plan.slug, n);
      return { kind: 'melolo', url: s.stream_url, note: 'Streaming penuh.', ...base };
    } catch {
      /* jatuh ke youtube/preview */
    }
  }
  if ((plan.kind === 'youtube' || plan.kind === 'melolo') && r.yt[n]) {
    return { kind: 'youtube', videoId: r.yt[n], note: 'Streaming penuh.', ...base };
  }
  const s = await dbStream(bookId, n).catch(() => null);
  const clip = s?.mp4 || s?.url || '';
  return {
    kind: 'preview',
    url: clip,
    note: clip
      ? 'Episode ini premium di sumber resmi — yang tersedia cuplikan 15 detik.'
      : 'Episode ini premium di sumber resmi dan tidak memiliki cuplikan.',
    ...base,
  };
}

/* ───────────────────────── kartu ringkas ───────────────────────── */

export function dbCardFromBook(b: DbBook) {
  return {
    bookId: b.bookId,
    title: b.title,
    cover: b.cover,
    episodeCount: b.chapterCount,
    rating: b.rating,
    genres: b.genres || [],
  };
}
