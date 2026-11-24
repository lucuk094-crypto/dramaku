/**
 * Klien data ReelShort (reelshort.com/id) — sumber katalog ketiga untuk
 * melengkapi genre/kategori yang masih kosong/kurang lengkap.
 *
 * Dua jalur data (keduanya halaman SSR publik, diparse __NEXT_DATA__):
 *  - Taksonomi lama (193 tag: genre/trope/karakter) → /id/movie-genres/{slug}-movies-{b64(nama)}
 *  - Taksonomi baru (Identitas 1020 / Story Beats 1022) → /id/tags/{kategori}/{slug}-movies-{idHex}
 * Detail seri + daftar episode lengkap → /id/movie/{slug}-{bookId} (slug bersifat kanonik/redirect).
 */

const RS_BASE = 'https://www.reelshort.com/id';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

export interface RsBook {
  id: string;
  title: string;
  cover: string;
  desc: string;
  chapters: number;
  tags: string[];
  reads?: number;
  isNew?: boolean;
  isAi?: boolean;
}

export interface RsBookDetail extends RsBook {
  total: number;
  readCount: number;
  collectCount: number;
  isDub: boolean;
  isAi: boolean;
  episodes: {
    chapterId: string;
    serial: number;
    pic: string;
    likes: number;
    publishAt: number;
  }[];
  tagNames: string[];
  sourceUrl: string;
}

function b64NoPad(s: string): string {
  return Buffer.from(s, 'utf-8').toString('base64').replace(/=+$/, '');
}

function slugifyRs(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Ambil __NEXT_DATA__ dari halaman SSR ReelShort (redirect diikuti otomatis). */
async function fetchNextData(url: string, revalidate = 900): Promise<any> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept-Language': 'id,en;q=0.8',
      Referer: 'https://www.reelshort.com/id',
    },
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`ReelShort ${res.status}: ${url}`);
  const html = await res.text();
  const m = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!m) throw new Error('ReelShort: __NEXT_DATA__ tidak ditemukan');
  return JSON.parse(m[1]);
}

function toBook(raw: any): RsBook {
  const tagList: string[] = (raw.theme || [])
    .map((t: any) => (typeof t === 'string' ? t.trim() : (t?.name || t?.tag_name || '').trim()))
    .filter(Boolean);
  const themeList: string[] = (raw.theme_list || [])
    .map((t: any) => (t?.name || t?.tag_name || '').trim())
    .filter(Boolean);
  return {
    id: raw._id || raw.book_id,
    title: (raw.book_title || '').trim(),
    cover: raw.book_pic || raw.default_pic || '',
    desc: (raw.special_desc || '').trim(),
    chapters: Number(raw.chapter_count ?? raw.total ?? 0) || 0,
    tags: [...new Set([...tagList, ...themeList])],
    reads: raw.read_count,
    isNew: raw.is_new === 1,
    isAi: raw.is_ai === 1,
  };
}

export interface RsPage {
  items: RsBook[];
  total: number;
  totalPage: number;
  page: number;
  tagName: string;
}

/**
 * Buku per tag taksonomi lama — /id/movie-genres/{slug}-movies-{b64(nama)}[/{hal}]
 * `nama` persis seperti tertulis di daftar tag (peka huruf besar/kecil).
 */
export async function getRsTagBooks(tagName: string, page = 1): Promise<RsPage> {
  const slug = slugifyRs(tagName);
  const tail = page > 1 ? `/${page}` : '';
  const d = await fetchNextData(
    `${RS_BASE}/movie-genres/${slug}-movies-${b64NoPad(tagName)}${tail}`,
    900,
  );
  const pp = d?.props?.pageProps || {};
  const tb = pp.tagBooks || {};
  return {
    items: (tb.books || []).map(toBook),
    total: pp.total ?? (tb.books || []).length,
    totalPage: pp.totalPage ?? 1,
    page: pp.page ?? page,
    tagName: pp.tagName ?? tagName,
  };
}

/**
 * Buku per tag taksonomi baru (Identitas/Story Beats) —
 * /id/tags/{kategori}/{slug}-movies-{idHex}[/{hal}]
 */
export async function getRsNewTagBooks(
  category: 'movie-identities' | 'story-beats' | 'mc-types' | 'movie-styles' | 'movie-themes',
  tagId: string,
  tagName: string,
  page = 1,
): Promise<RsPage> {
  const slug = slugifyRs(tagName);
  const tail = page > 1 ? `/${page}` : '';
  const d = await fetchNextData(`${RS_BASE}/tags/${category}/${slug}-movies-${tagId}${tail}`, 900);
  const pp = d?.props?.pageProps || {};
  const tb = pp.tagBooks || {};
  return {
    items: (tb.books || []).map(toBook),
    total: pp.total ?? (tb.books || []).length,
    totalPage: pp.totalPage ?? 1,
    page: pp.page ?? page,
    tagName: tb.tag_name ?? tagName,
  };
}

/** Katalog "Rilis Baru" (shelf bs_id 51002665, ~200 judul, per halaman 200/17). */
export async function getRsShelf(bsId: number, page = 1, revalidate = 900): Promise<RsPage> {
  const tail = page > 1 ? `/${page}` : '';
  const d = await fetchNextData(`${RS_BASE}/shelf/x-${bsId}${tail}`, revalidate);
  const pp = d?.props?.pageProps || {};
  return {
    items: (pp.list || []).map(toBook),
    total: pp.total ?? (pp.list || []).length,
    totalPage: pp.totalPage ?? 1,
    page: pp.page ?? page,
    tagName: pp.shelfName ?? 'Shelf',
  };
}

/** Rilisan baru ReelShort (shelf "Rilis Baru"). */
export function getRsNewRelease(page = 1): Promise<RsPage> {
  return getRsShelf(51002665, page);
}

/** Detail seri + daftar episode lengkap. */
export async function getRsBook(bookId: string): Promise<RsBookDetail | null> {
  try {
    const d = await fetchNextData(`${RS_BASE}/movie/x-${bookId}`, 900);
    const raw = d?.props?.pageProps?.data;
    if (!raw?.book_id) return null;
    const episodes = (raw.online_base || []).map((c: any) => ({
      chapterId: c.chapter_id,
      serial: c.serial_number ?? 0,
      pic: c.video_pic || '',
      likes: c.like_count ?? 0,
      publishAt: c.publish_at ?? 0,
    }));
    return {
      id: raw.book_id,
      title: (raw.book_title || '').trim(),
      cover: raw.book_pic || '',
      desc: (raw.special_desc || '').trim(),
      chapters: raw.total ?? episodes.length,
      tags: (raw.tag || []).map((t: string) => t.trim()).filter(Boolean),
      total: raw.total ?? episodes.length,
      readCount: raw.read_count ?? 0,
      collectCount: raw.collect_count ?? 0,
      isDub: !!raw.is_dub || !!raw.has_dub,
      isAi: raw.is_ai === 1,
      episodes,
      tagNames: (raw.tag_list || []).map((t: any) => (t.name || t.tag_name || '').trim()).filter(Boolean),
      sourceUrl: `https://www.reelshort.com/id/movie/x-${bookId}`,
    };
  } catch {
    return null;
  }
}

/** URL tonton episode di ReelShort (pola publik: episode-{n}-{slug}-{bookId}-{chapterId}). */
export function rsEpisodeUrl(book: { id: string; title: string }, chapterId: string, serial: number): string {
  return `https://www.reelshort.com/id/episodes/episode-${serial || 1}-${slugifyRs(book.title)}-${book.id}-${chapterId}?play_time=1`;
}

/** Halaman seri di ReelShort (redirect ke slug kanonik). */
export function rsBookUrl(id: string): string {
  return `https://www.reelshort.com/id/movie/x-${id}`;
}

/** Gabungkan hasil beberapa tag menjadi daftar unik (anti-dobel per judul). */
export function mergeRsPages(pages: RsPage[], target = 24): RsBook[] {
  const seen = new Set<string>();
  const out: RsBook[] = [];
  for (const p of pages) {
    for (const b of p.items) {
      const key = b.title.toLowerCase();
      if (!b.id || !b.title || seen.has(key)) continue;
      seen.add(key);
      out.push(b);
      if (out.length >= target) return out;
    }
  }
  return out;
}

/* ===================== PEMUTARAN (HLS) ===================== */

export interface RsEpisodeVideo {
  bookId: string;
  chapterId: string;
  /** URL m3u8 kualitas SD (dipakai bila tersedia) */
  sdUrl: string;
  /** URL m3u8 kualitas LD (fallback) */
  ldUrl: string;
}

/**
 * URL video HLS sebuah episode — diambil dari halaman episode SSR
 * (field `video_url` / `episode.video_url`). Berlaku untuk SEMUA episode,
 * termasuk yang di sumbernya berbayar.
 */
export async function getRsEpisodeVideo(
  bookId: string,
  chapterId: string,
  serial = 1,
): Promise<RsEpisodeVideo | null> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const d = await fetchNextData(
        `${RS_BASE}/episodes/episode-${serial}-x-${bookId}-${chapterId}?play_time=1`,
        3600,
      );
      const pp = d?.props?.pageProps || {};
      const da = pp?.data || {};

      // validasi: halaman harus milik judul & episode yang diminta
      // (URL -x- bisa membalas halaman judul lain bila chapter tidak valid)
      if (da?.book_id && da.book_id !== bookId) return null;
      if (da?.chapter_id && chapterId && da.chapter_id !== chapterId) return null;

      let ld: string = (typeof pp?.episode === 'object' && pp?.episode?.video_url) || da?.video_url || '';

      // Episode berbayar sering tanpa video_url — hash VOD masih bocor di
      // video_pic (…/vod-xxxx/{hash}/snapshots/…). Susun URL m3u8 dari hash itu.
      if (!ld || !/\.m3u8/.test(ld)) {
        const pic: string = da?.video_pic || '';
        const m = pic.match(/\/vod-\d+\/([a-f0-9]{16,})\//);
        if (m) {
          ld = `https://v-mps.crazymaplestudios.com/${m[1]}/h264-ordinary-ld.m3u8`;
        }
      }

      if (ld && /\.m3u8/.test(ld)) {
        const sd = ld.replace('h264-ordinary-ld.m3u8', 'h264-ordinary-sd.m3u8');
        return { bookId, chapterId, sdUrl: sd, ldUrl: ld };
      }
    } catch {
      /* throttle / jaringan — jeda lalu coba lagi */
    }
    await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
  }
  return null;
}

/** Katalog lengkap "Semua" (3.600+ judul, termasuk rilisan tahun-tahun sebelumnya). */
export function getRsAllBooks(page = 1): Promise<RsPage> {
  return (async () => {
    const tail = page > 1 ? `/${page}` : '';
    const d = await fetchNextData(`${RS_BASE}/movie-genres/all-movies${tail}`, 900);
    const pp = d?.props?.pageProps || {};
    return {
      items: (pp.list || pp.tagBooks?.books || []).map(toBook),
      total: pp.total ?? 0,
      totalPage: pp.totalPage ?? 1,
      page: pp.page ?? page,
      tagName: 'Semua',
    };
  })();
}
