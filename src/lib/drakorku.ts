/**
 * Drakorku — katalog drakor/drama Asia (API theresav.eu / Blckrosé).
 *
 * Dua sumber data:
 *  1. `category?category={X}`  → katalog judul per genre (26 genre, 70/genre)
 *     : catId, title, image, landscape, status, rating, year, genre,
 *       contentRating, trailer, synopsis
 *  2. `search?query={q}` + `detail?id={id}` → database episode dengan video
 *     MP4 langsung (urlSd/urlHd) — total >58.000 episode. `categoryName` =
 *     nama serial, `episode` = nomor episode, `videoCount` = total episode.
 */

const API = 'https://api.theresav.eu/api/drama/drakorku';
const API_KEY = 'REFXr';
const VIDEO_HOST = /^https?:\/\/durian\.whatbox\.ca[:/]/i;

export const DK_CATEGORIES: string[] = [
  'Romance', 'Drama', 'Comedy', 'Mystery', 'Thriller', 'Historical', 'Action',
  'Fantasy', 'Life', 'Crime', 'Youth', 'Melodrama', 'Supernatural', 'Horror',
  'Wuxia', 'Psychological', 'Adventure', 'Business', 'Family', 'Sci-Fi',
  'Music', 'Law', 'Political', 'Food', 'Medical', 'Sports',
];

/** pemetaan genre/kategori kita → kata kunci pencarian Drakorku */
export const DK_GENRE_MAP: Record<string, string> = {
  romansa: 'Romance', romance: 'Romance',
  fantasi: 'Fantasy', fantasy: 'Fantasy',
  thriller: 'Thriller', ketegangan: 'Thriller',
  misteri: 'Mystery', mystery: 'Mystery',
  aksi: 'Action', action: 'Action', 'serangan-balasan': 'Action',
  komedi: 'Comedy', comedy: 'Comedy',
  melodrama: 'Melodrama',
  horor: 'Horror', horror: 'Horror',
  crime: 'Crime', kriminal: 'Crime', pembalasan: 'Crime',
  petualangan: 'Adventure', adventure: 'Adventure',
  keluarga: 'Family', family: 'Family',
  medis: 'Medical', medical: 'Medical', kedokteran: 'Medical',
  olahraga: 'Sports', sports: 'Sports',
  musik: 'Music', music: 'Music',
  politik: 'Political', political: 'Political',
  bisnis: 'Business', business: 'Business',
  hukum: 'Law', law: 'Law',
  'sci-fi': 'Sci-Fi', scifi: 'Sci-Fi',
  psikologis: 'Psychological', psychological: 'Psychological',
  sejarah: 'Historical', historical: 'Historical',
  wuxia: 'Wuxia',
  supranatural: 'Supernatural', supernatural: 'Supernatural',
  remaja: 'Youth', youth: 'Youth',
  kehidupan: 'Life', life: 'Life',
  perkotaan: 'Life', 'kelahiran-kembali': 'Fantasy',
  'perkawinan': 'Romance', 'perjodohan': 'Romance',
  'dokter': 'Medical', 'ceo': 'Romance', miliarder: 'Romance',
  vampir: 'Supernatural', werewolf: 'Supernatural', 'serigala': 'Supernatural',
  'dunia-lain': 'Fantasy', 'kembali-muda': 'Fantasy', 'kembali-ke-masa-lalu': 'Fantasy',
};

export interface DkCatalogItem {
  catId: number;
  title: string;
  image: string;
  landscape: string;
  status: string;
  rating: number;
  year: number;
  genre: string;
  contentRating: string;
  trailer: string;
  synopsis: string;
}

export interface DkEpisodeEntry {
  id: number;
  catId: number;
  title: string;
  categoryName: string;
  episode: number;
  urlSd: string | null;
  urlHd: string | null;
  urlEng: string | null;
  thumbnail: string;
  landscape: string;
  trailer: string;
  genre: string;
  year: number;
  rating: number;
  status: string;
  contentRating: string;
  synopsis?: string;
  videoCount?: number;
  views?: number;
  date?: string;
}

export interface DkEpisode {
  n: number;
  id: number;
  src: string; // URL proxy siap putar
  pic: string;
}

export interface DkSeries {
  name: string;
  slug: string;
  cover: string;
  landscape: string;
  genre: string;
  year: number;
  rating: number;
  status: string;
  contentRating: string;
  trailer: string;
  synopsis: string;
  /** total episode resmi (untuk grid 1..N lengkap, termasuk yang segera dirilis) */
  total: number;
  episodes: DkEpisode[];
}

/* ───────────────────────── util ───────────────────────── */

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** URL proxy video (host dibatasi allowlist) */
export function dkVideoProxy(url: string): string {
  return `/api/dk-video?u=${Buffer.from(url).toString('base64url')}`;
}

async function dkFetch<T>(path: string, revalidate = 900): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'x-apikey': API_KEY },
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`drakorku ${res.status}`);
  return res.json() as Promise<T>;
}

/* ───────────────────────── katalog ───────────────────────── */

export async function dkCategory(category: string): Promise<{ total: number; items: DkCatalogItem[] }> {
  const d = await dkFetch<{ status: boolean; result: { total: number; items: DkCatalogItem[] } }>(
    `/category?category=${encodeURIComponent(category)}`,
  );
  if (!d.status) throw new Error('drakorku category gagal');
  return d.result;
}

/* ───────────────────────── pencarian episode ───────────────────────── */

export async function dkSearch(query: string): Promise<{ total: number; items: DkEpisodeEntry[] }> {
  const d = await dkFetch<{ status: boolean; result: { total: number; items: DkEpisodeEntry[] } }>(
    `/search?query=${encodeURIComponent(query)}`,
    600,
  );
  if (!d.status) throw new Error('drakorku search gagal');
  return d.result;
}

export async function dkDetail(id: number | string): Promise<DkEpisodeEntry> {
  const d = await dkFetch<{ status: boolean; result: DkEpisodeEntry }>(`/detail?id=${id}`, 3600);
  if (!d.status) throw new Error('drakorku detail gagal');
  return d.result;
}

function toEpisode(e: DkEpisodeEntry): DkEpisode {
  const raw = e.urlSd || e.urlHd || e.urlEng || '';
  return {
    n: e.episode,
    id: e.id,
    src: raw && VIDEO_HOST.test(raw) ? dkVideoProxy(raw) : '',
    pic: e.thumbnail || e.landscape || '',
  };
}

/* ───────────────────────── serial ───────────────────────── */

const pendingSeries = new Map<string, Promise<DkSeries | null>>();

/** ambil serial lengkap 1..N dari database episode (berdasarkan nama) */
export async function dkSeriesByName(name: string): Promise<DkSeries | null> {
  const key = norm(name);
  if (pendingSeries.has(key)) return pendingSeries.get(key)!;
  const job = (async (): Promise<DkSeries | null> => {
    const { items } = await dkSearch(name);
    const hits = items.filter((i) => norm(i.categoryName) === key);
    const pool = hits.length
      ? hits
      : items.filter((i) => norm(i.categoryName).includes(key)).slice(0, 70);
    if (pool.length === 0) return null;

    const seriesName = pool[0].categoryName.trim();
    const head = pool[0];

    // total episode resmi
    let total = 0;
    try {
      const det = await dkDetail(head.id);
      total = det.videoCount || 0;
    } catch {}
    const maxSeen = Math.max(...pool.map((p) => p.episode));
    total = Math.max(total, maxSeen, pool.length);
    if (total > 220) total = 220;

    const byEp = new Map<number, DkEpisodeEntry>();
    for (const p of pool) {
      const prev = byEp.get(p.episode);
      if (!prev || (!(prev.urlSd || prev.urlHd) && (p.urlSd || p.urlHd))) byEp.set(p.episode, p);
    }

    // lengkapi episode yang belum ada (untuk serial panjang >70)
    const missing: number[] = [];
    for (let n = 1; n <= total; n += 1) if (!byEp.has(n)) missing.push(n);
    const queue = missing;
    let cursor = 0;
    const worker = async () => {
      while (cursor < queue.length) {
        const n = queue[cursor];
        cursor += 1;
        try {
          const { items: found } = await dkSearch(`${seriesName} Eps ${n}`);
          const exact = found.find((f) => norm(f.categoryName) === norm(seriesName) && f.episode === n);
          if (exact && (exact.urlSd || exact.urlHd)) byEp.set(n, exact);
        } catch {}
      }
    };
    await Promise.all(Array.from({ length: 4 }, worker));

    const episodes = [...byEp.values()]
      .filter((e) => e.urlSd || e.urlHd || e.urlEng)
      .map(toEpisode)
      .sort((a, b) => a.n - b.n);
    if (episodes.length === 0) return null;

    // metadata: dari episode dulu, sisanya dari katalog bila perlu
    const meta = await dkFindMeta(seriesName).catch(() => null);
    return {
      name: seriesName,
      slug: slugify(seriesName),
      cover: head.thumbnail || meta?.image || '',
      landscape: head.landscape || meta?.landscape || '',
      genre: head.genre || meta?.genre || 'Drama',
      year: head.year || meta?.year || 0,
      rating: head.rating || meta?.rating || 0,
      status: head.status || meta?.status || '',
      contentRating: head.contentRating || meta?.contentRating || '',
      trailer: head.trailer || meta?.trailer || '',
      synopsis: (head.synopsis || meta?.synopsis || '').trim(),
      total,
      episodes,
    };
  })();
  pendingSeries.set(key, job);
  try {
    return await job;
  } catch {
    pendingSeries.delete(key);
    throw job.catch(() => null);
  }
}

export async function dkSeriesBySlug(slug: string): Promise<DkSeries | null> {
  const readable = decodeURIComponent(slug).replace(/-/g, ' ').trim();
  return dkSeriesByName(readable);
}

/* ───────────────────────── daftar serial (untuk rail/kartu) ───────────────────────── */

export interface DkSeriesCard {
  name: string;
  slug: string;
  cover: string;
  landscape: string;
  genre: string;
  year: number;
  rating: number;
  status: string;
  playable: boolean;
}

/** hasil pencarian episode → daftar serial unik (kartu) */
export async function dkSeriesCards(query: string, take = 24): Promise<DkSeriesCard[]> {
  const { items } = await dkSearch(query);
  const map = new Map<string, DkSeriesCard>();
  for (const it of items) {
    const name = it.categoryName.trim();
    if (!name) continue;
    const key = norm(name);
    const prev = map.get(key);
    const playable = !!(it.urlSd || it.urlHd);
    if (!prev) {
      map.set(key, {
        name,
        slug: slugify(name),
        cover: it.thumbnail || '',
        landscape: it.landscape || '',
        genre: it.genre || 'Drama',
        year: it.year || 0,
        rating: it.rating || 0,
        status: it.status || '',
        playable,
      });
    } else if (playable) prev.playable = true;
  }
  return [...map.values()].slice(0, take);
}

/** peta cepat: nama → serial kartu (dari query "Eps 01" per genre) */
export async function dkGenreCards(genreQuery: string, take = 24): Promise<DkSeriesCard[]> {
  const q = DK_GENRE_MAP[genreQuery.toLowerCase()] || genreQuery;
  try {
    return await dkSeriesCards(q, take);
  } catch {
    return [];
  }
}

/* ───────────────────────── index katalog (fallback metadata) ───────────────────────── */

let catalogIndex: Map<string, DkCatalogItem> | null = null;
let catalogIndexP: Promise<Map<string, DkCatalogItem>> | null = null;

async function buildCatalogIndex(): Promise<Map<string, DkCatalogItem>> {
  const map = new Map<string, DkCatalogItem>();
  for (let i = 0; i < DK_CATEGORIES.length; i += 4) {
    const chunk = DK_CATEGORIES.slice(i, i + 4);
    const results = await Promise.all(chunk.map((c) => dkCategory(c).catch(() => ({ total: 0, items: [] }))));
    for (const r of results) for (const it of r.items) map.set(norm(it.title), it);
  }
  return map;
}

export async function dkFindMeta(title: string): Promise<DkCatalogItem | null> {
  if (catalogIndex) {
    return catalogIndex.get(norm(title)) || looseMeta(catalogIndex, title);
  }
  if (!catalogIndexP) catalogIndexP = buildCatalogIndex();
  catalogIndex = await catalogIndexP;
  return catalogIndex.get(norm(title)) || looseMeta(catalogIndex, title);
}

function looseMeta(map: Map<string, DkCatalogItem>, title: string): DkCatalogItem | null {
  const key = norm(title);
  if (key.length < 4) return null;
  for (const [k, v] of map) if (k.includes(key) || key.includes(k)) return v;
  return null;
}

/** daftar katalog untuk halaman kategori */
export async function dkCategoryCards(category: string): Promise<DkCatalogItem[]> {
  try {
    const { items } = await dkCategory(category);
    return items;
  } catch {
    return [];
  }
}

/* ───────────────────────── kecil ───────────────────────── */

export function dkStripHtml(html: string, max = 700): string {
  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{2,}/g, '\n')
    .trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export { VIDEO_HOST as DK_VIDEO_HOST };
