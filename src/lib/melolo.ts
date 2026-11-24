/**
 * DramaKu — lapisan data server-side untuk katalog Melolo (melolo.com).
 * Port lean dari scraper fixed-v2 (2026-11-23, terverifikasi real-time).
 *
 * Sumber data:
 *  - HTML SSR + payload RSC  : /id/category, /id/ranking, /id/category/{genre}[/{page}]
 *  - JSON API                : getSeriesBySlug, searchNovelsByQuery, getNovelsBySlug
 *  - Stream                  : URL signed CDN (Referer wajib https://melolo.com/, TTL ~300 dtk)
 */
import { unstable_cache } from 'next/cache';
import * as cheerio from 'cheerio';

export const BASE = 'https://melolo.com';
export const CDN_HOST = 'v.melolo.com';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const DEFAULT_LANG = 'id';

/* ------------------------------------------------------------------ types */

export interface Genre {
  slug: string | null;
  name: string;
}

export interface MediaCard {
  type: 'series' | 'novels' | 'article';
  slug: string;
  title: string | null;
  cover: string | null;
  rating: string | null;
  rank: number | null;
  episode_count: number | null;
  description: string | null;
  genres: Genre[];
  publish_date?: string | null;
  url: string;
}

export interface Section {
  title: string;
  items: MediaCard[];
}

export interface HomeData {
  genres: { slug: string; name: string; url: string }[];
  sections: Section[];
}

export interface EpisodeInfo {
  episode_id: number;
  title: string;
  playable: boolean;
}

export interface SeriesDetail {
  series_slug: string;
  title: string | null;
  description: string | null;
  short_description: string | null;
  cover: string | null;
  photos: string[];
  rating: string | null;
  reviewers: number | null;
  episode_count: number;
  release_date: string | null;
  country: string | null;
  languages: string[];
  genres: Genre[];
  cast: string[];
  story_plot: string | null;
  review_text: string | null;
  faq: { question: string; answer: string }[] | null;
  seo_title: string | null;
  seo_desc: string | null;
  dubbed_versions: { language: string | null; platform: string | null; url: string | null }[];
  recommendations: MediaCard[];
  platform_series: MediaCard[];
  recommended_articles: MediaCard[];
  episodes: EpisodeInfo[];
  /** Jumlah episode yang benar-benar bisa diputar (ada stream di hulu, semua bahasa digabung). */
  availableCount: number;
  source_url: string;
}

export interface SearchResult {
  query: string;
  type: string;
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  type_counts: Record<string, number>;
  items: MediaCard[];
}

export interface CategoryResult {
  genre: string;
  page: number;
  total_pages: number;
  has_next: boolean;
  items: MediaCard[];
}

export interface SignedStream {
  series_slug: string;
  episode_id: number;
  stream_url: string;
  expires_in: number | null;
}

/* ------------------------------------------------------------- primitives */

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(url: string, options: { json?: boolean; timeout?: number; retries?: number } = {}) {
  const { json = false, timeout = 12000, retries = 1 } = options;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: json ? 'application/json' : 'text/html,application/xhtml+xml',
        Referer: `${BASE}/`,
      },
      signal: AbortSignal.timeout(timeout),
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      const err: any = new Error(`HTTP ${res.status} ${res.statusText}`);
      err.status = res.status;
      throw err;
    }
    return json ? await res.json() : await res.text();
  } catch (err: any) {
    const retryable = !err.status || err.status === 429 || err.status >= 500;
    if (retries > 0 && retryable) {
      await delay(err.status === 429 ? 1500 : 600);
      return request(url, { ...options, retries: retries - 1 });
    }
    throw err;
  }
}

/** Request tanpa cache — untuk stream sign yang harus segar (TTL ~300 dtk). */
async function requestFresh(url: string, json = true) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: json ? 'application/json' : 'text/html',
      Referer: `${BASE}/`,
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) {
    const err: any = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return json ? res.json() : res.text();
}

const localePath = (lang: string, pathname: string) => `${lang === 'en' ? '' : `/${lang}`}${pathname}`;
const pageUrl = (lang: string, pathname: string) => `${BASE}${localePath(lang, pathname)}`;
const seriesUrl = (lang: string, slug: string) => pageUrl(lang, `/dramas/${slug}`);
const novelUrl = (lang: string, slug: string) => pageUrl(lang, `/novels/${slug}`);
const articleUrl = (lang: string, slug: string) => pageUrl(lang, `/guides/${slug}`);

const apiUrl = (lang: string, slug: string, episode: number | string = 1) =>
  `${BASE}/api/series/getSeriesBySlug?language=${encodeURIComponent(lang)}` +
  `&series_slug=${encodeURIComponent(slug)}&pageType=play&episode_id=${episode}`;

const searchApiUrl = (lang: string, query: string, type: string, page: number, size: number) =>
  `${BASE}/api/novels/searchNovelsByQuery?language=${encodeURIComponent(lang)}` +
  `&query=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}&page=${page}&page_size=${size}`;

const novelApiUrl = (lang: string, slug: string) =>
  `${BASE}/api/novels/getNovelsBySlug?language=${encodeURIComponent(lang)}&novels_slug=${encodeURIComponent(slug)}`;

/* ------------------------------------------------------------- normalizers */

function normalizeGenres(list: any): Genre[] {
  return (list || [])
    .map((genre: any): Genre | null => {
      if (typeof genre === 'string') return { slug: null, name: genre };
      if (!genre) return null;
      return {
        slug: genre.genre_slug || genre.slug || null,
        name: genre.name || genre.genre_slug || null,
      };
    })
    .filter((g: Genre | null): g is Genre => Boolean(g && g.name));
}

function normalizeCard(card: Partial<MediaCard> & { slug: string }, lang: string): MediaCard {
  const type = card.type || 'series';
  return {
    type,
    slug: card.slug,
    title: card.title || null,
    cover: card.cover || null,
    rating: card.rating || null,
    rank: card.rank ?? null,
    episode_count: card.episode_count ?? null,
    description: card.description || null,
    genres: card.genres || [],
    publish_date: card.publish_date ?? null,
    url:
      type === 'novels'
        ? novelUrl(lang, card.slug)
        : type === 'article'
          ? articleUrl(lang, card.slug)
          : seriesUrl(lang, card.slug),
  };
}

/* --------------------------------------------------------------- HTML parse */

/** Payload RSC (self.__next_f) di HTML melolo kadang memuat episode_num, genre_list, short_desc. */
function parseRscSeriesMap(html: string): Map<string, { episode_num?: number; short_desc?: string; genre_list?: any[] }> {
  const map = new Map<string, { episode_num?: number; short_desc?: string; genre_list?: any[] }>();
  const chunks = html.match(/self\.__next_f\.push\(\[1,\s*"((?:[^"\\]|\\.)*)"\]\)/g) || [];
  let payload = '';
  for (const chunk of chunks) {
    const inner = chunk.match(/"((?:[^"\\]|\\.)*)"\]\)$/);
    if (inner) payload += JSON.parse(`"${inner[1]}"`);
  }
  if (!payload) return map;

  const slugRegex = /"series_slug"\s*:\s*"([^"]+)"/g;
  let match: RegExpExecArray | null;
  const slugs = new Set<string>();
  while ((match = slugRegex.exec(payload))) slugs.add(match[1]);

  for (const slug of slugs) {
    const entry: { episode_num?: number; short_desc?: string; genre_list?: any[] } = {};
    const epMatch = payload.match(
      new RegExp(`"episode_num"\\s*:\\s*(\\d+)[\\s\\S]{0,400}?"series_slug"\\s*:\\s*"${slug}"`),
    );
    if (epMatch) entry.episode_num = Number(epMatch[1]);
    const descMatch = payload.match(new RegExp(`"series_slug"\\s*:\\s*"${slug}"\\s*,\\s*"short_desc"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
    if (descMatch) {
      try {
        entry.short_desc = JSON.parse(`"${descMatch[1]}"`);
      } catch {
        entry.short_desc = descMatch[1];
      }
    }
    const genreMatch = payload.match(
      new RegExp(`"genre_list"\\s*:\\s*(\\[[^\\]]*\\])\\s*,\\s*"name"\\s*:\\s*"[^"]*"\\s*,\\s*"rating"\\s*:\\s*"[^"]*"\\s*,\\s*"series_slug"\\s*:\\s*"${slug}"`),
    );
    if (genreMatch) {
      try {
        entry.genre_list = JSON.parse(genreMatch[1]);
      } catch {
        /* abaikan */
      }
    }
    if (entry.episode_num !== undefined || entry.short_desc || entry.genre_list) map.set(slug, entry);
  }
  return map;
}

function applySeriesMap(items: MediaCard[], map: Map<string, any>): MediaCard[] {
  return items.map((item) => {
    const extra = map.get(item.slug);
    if (!extra) return item;
    return {
      ...item,
      episode_count: item.episode_count ?? extra.episode_num ?? null,
      description: item.description || extra.short_desc || null,
      genres: item.genres.length ? item.genres : normalizeGenres(extra.genre_list),
    };
  });
}

const genreSlugFromHref = (href?: string) => {
  const match = (href || '').match(/\/category\/([a-z0-9-]+)/i);
  return match ? match[1] : null;
};

function cardFromLink($: cheerio.CheerioAPI, link: any, lang: string): MediaCard | null {
  const a = $(link);
  const href = a.attr('href') || '';
  const match = href.match(/\/(?:dramas|fullmovies)\/([a-z0-9-]+)/i);
  if (!match) return null;
  const slug = match[1];

  let cover = a.find('img').attr('src') || a.find('img').attr('data-src') || null;
  let title = a.attr('aria-label') || a.find('img').attr('alt') || '';
  let rating: string | null = null;
  let rank: number | null = null;
  let description: string | null = null;
  let genres: Genre[] = [];

  let box = a.closest('div');
  for (let depth = 0; depth < 5 && box.length; depth += 1) {
    // jangan naik ke container yang memuat >1 drama berbeda (itu section/grid, bukan card)
    const distinct = new Set(
      box
        .find('a[href*="/dramas/"]')
        .map((_: number, el: any) => $(el).attr('href'))
        .get(),
    );
    if (distinct.size > 1) break;

    if (!cover) cover = box.find('img').attr('src') || box.find('img').attr('data-src') || cover;

    if (!title || title === slug) {
      const heading = box
        .find('a[href*="/dramas/"]')
        .map((_: number, el: any) => ($(el).attr('aria-label') || $(el).text() || '').replace(/\s+/g, ' ').trim())
        .get()
        .filter((t: string) => t.length > 1)[0];
      if (heading) title = heading;
    }

    const ratingEl = box
      .find('*')
      .map((_: number, el: any) => {
        const t = $(el).text().replace(/\s+/g, ' ').trim();
        return /^\d\.\d$/.test(t) ? t : null;
      })
      .get()
      .filter(Boolean)[0];
    if (!rating && ratingEl) rating = ratingEl;

    const rankEl = box
      .find('*')
      .map((_: number, el: any) => {
        const t = $(el).text().replace(/\s+/g, ' ').trim();
        return /^\d{1,2}$/.test(t) ? Number(t) : null;
      })
      .get()
      .filter((n: number | null): n is number => n !== null)[0];
    if (rank === null && rankEl !== undefined) rank = rankEl;

    if (!genres.length) {
      genres = box
        .find('a[href*="/category/"]')
        .map((_: number, el: any) => {
          const gSlug = genreSlugFromHref($(el).attr('href'));
          const gName = $(el).attr('aria-label') || $(el).text().replace(/\s+/g, ' ').trim();
          return gName ? { slug: gSlug, name: gName } : null;
        })
        .get()
        .filter(Boolean);
    }

    if (!description) {
      const clampText = box
        .find('div[class*="line-clamp"]')
        .first()
        .text()
        .replace(/\s+/g, ' ')
        .trim();
      if (clampText && clampText.length > 40) {
        description = clampText;
      } else {
        const leafTexts = box
          .find('div')
          .filter((_: number, el: any) => $(el).children('div').length === 0 && $(el).find('a').length === 0)
          .map((_: number, el: any) => $(el).text().replace(/\s+/g, ' ').trim())
          .get()
          .filter((t: string) => t.length > 40);
        if (leafTexts.length) description = leafTexts.sort((x: string, y: string) => y.length - x.length)[0];
      }
    }

    box = box.parent();
  }

  return normalizeCard(
    {
      type: 'series',
      slug,
      title: title || slug,
      cover,
      rating,
      rank,
      description,
      genres,
    },
    lang,
  );
}

function parseSections($: cheerio.CheerioAPI, lang: string): Section[] {
  const sections: { title: string; items: MediaCard[]; seen: Set<string> }[] = [];
  let current: { title: string; items: MediaCard[]; seen: Set<string> } | null = null;

  $('h1,h2,h3,a[href*="/dramas/"]').each((_: number, element: any) => {
    const tag = (element.tagName || '').toLowerCase();
    if (/^h[1-3]$/.test(tag)) {
      const title = $(element).text().replace(/\s+/g, ' ').trim();
      if (!title) return;
      current = { title, items: [], seen: new Set() };
      sections.push(current);
      return;
    }
    if (!current) return;
    const card = cardFromLink($, element, lang);
    if (!card || current.seen.has(card.slug)) return;
    current.seen.add(card.slug);
    current.items.push(card);
  });

  return sections
    .filter((section) => section.items.length)
    .map((section) => ({ title: section.title, items: section.items }));
}

function parseGenres($: cheerio.CheerioAPI, lang: string) {
  const genres: { slug: string; name: string; url: string }[] = [];
  const seen = new Set<string>();
  $('a[href*="/category/"]').each((_: number, element: any) => {
    const a = $(element);
    const slug = genreSlugFromHref(a.attr('href'));
    if (!slug) return;
    const name = a.attr('aria-label') || a.text().replace(/\s+/g, ' ').trim();
    if (!name || seen.has(slug)) return;
    seen.add(slug);
    genres.push({ slug, name, url: pageUrl(lang, `/category/${slug}`) });
  });
  return genres;
}

/* ------------------------------------------------------- API normalizers */

function mapSearchItem(item: any, type: string, lang: string): MediaCard | null {
  if (item?.article_slug) {
    return normalizeCard(
      {
        type: 'article',
        slug: item.article_slug,
        title: item.title || item.name || null,
        cover: item.banner || null,
        description: item.content_abstract || null,
        publish_date: item.publish_date || null,
        rating: null,
        genres: [],
      },
      lang,
    );
  }
  if (item?.novels_slug) {
    return normalizeCard(
      {
        type: 'novels',
        slug: item.novels_slug,
        title: item.name || null,
        cover: item.cover_url || null,
        rating: item.rating || null,
        episode_count: item.episode_num ?? null,
        description: item.short_desc || null,
        genres: normalizeGenres(item.genre_list),
      },
      lang,
    );
  }
  if (item?.series_slug) {
    return normalizeCard(
      {
        type: 'series',
        slug: item.series_slug,
        title: item.name || null,
        cover: item.cover_url || null,
        rating: item.rating || null,
        episode_count: item.episode_num ?? null,
        description: item.short_desc || item.desc || null,
        genres: normalizeGenres(item.genre_list),
      },
      lang,
    );
  }
  return null;
}

/* ----------------------------------------------------------------- public */

export async function getHome(lang = DEFAULT_LANG): Promise<HomeData> {
  const html = await request(pageUrl(lang, '/category'));
  const $ = cheerio.load(html);
  const genres = orderGenres(parseGenres($, lang));
  const rscMap = parseRscSeriesMap(html);
  const sections = await Promise.all(
    parseSections($, lang).map(async (section) => ({
      ...section,
      items: await fillMissingCovers(applySeriesMap(section.items, rscMap), lang),
    })),
  );
  return { genres, sections };
}

export async function getRanking(lang = DEFAULT_LANG): Promise<Section[]> {
  const html = await request(pageUrl(lang, '/ranking'));
  const $ = cheerio.load(html);
  const rscMap = parseRscSeriesMap(html);
  return Promise.all(
    parseSections($, lang).map(async (section) => ({
      ...section,
      items: await fillMissingCovers(applySeriesMap(section.items, rscMap), lang),
    })),
  );
}

export async function getCategory(genre: string, page = 1, lang = DEFAULT_LANG): Promise<CategoryResult> {
  const currentPage = Math.max(1, page);
  const pathname = currentPage === 1 ? `/category/${genre}` : `/category/${genre}/${currentPage}`;
  const html = await request(pageUrl(lang, pathname));
  const $ = cheerio.load(html);

  const seen = new Set<string>();
  let items = parseSections($, lang)
    .flatMap((section) => section.items)
    .filter((item) => {
      if (seen.has(item.slug)) return false;
      seen.add(item.slug);
      return true;
    });
  items = applySeriesMap(items, parseRscSeriesMap(html));
  items = await fillMissingCovers(items, lang);

  const pageNumbers: number[] = [];
  $(`a[href*="/category/${genre}/"]`).each((_: number, element: any) => {
    const match = ($(element).attr('href') || '').match(new RegExp(`/category/${genre}/(\\d+)$`));
    if (match) pageNumbers.push(Number(match[1]));
  });
  const totalPages = Math.max(currentPage, ...pageNumbers);
  const hasNext = $('a[rel="next"]').length > 0 || currentPage < totalPages;

  return { genre, page: currentPage, total_pages: totalPages, has_next: hasNext, items };
}

/**
 * Kategori NOVEL (mis. werewolf, vampire, sci-fi, adventure) berada di jalur
 * /novels/category/{genre} — bukan /category/{genre}. Genre tersebut tidak
 * punya drama video di sumber, jadi kita tampilkan koleksi novelnya.
 */
export async function getNovelCategory(genre: string, page = 1, lang = DEFAULT_LANG): Promise<CategoryResult> {
  const currentPage = Math.max(1, page);
  const pathname = currentPage === 1 ? `/novels/category/${genre}` : `/novels/category/${genre}/${currentPage}`;
  const html = await request(pageUrl(lang, pathname));
  const $ = cheerio.load(html);

  const seen = new Set<string>();
  const items: MediaCard[] = [];
  $('a[href*="/novels/"]').each((_: number, element: any) => {
    const a = $(element);
    const match = (a.attr('href') || '').match(/\/novels\/([a-z0-9-]+)/i);
    if (!match) return;
    const slug = match[1];
    if (slug === 'category' || seen.has(slug)) return;
    seen.add(slug);

    let cover = a.find('img').attr('src') || a.find('img').attr('data-src') || null;
    let title = (a.attr('aria-label') || a.find('img').attr('alt') || '')
      .replace(/^Sampul Novel\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cover) cover = a.parent().find('img').attr('src') || null;
    if (!title || title === slug) {
      const sibling = a
        .parent()
        .find(`a[href*="/novels/${slug}"]`)
        .map((__: number, el: any) => ($(el).attr('aria-label') || $(el).text() || '').replace(/\s+/g, ' ').trim())
        .get()
        .filter((t: string) => t.length > 1)[0];
      if (sibling) title = sibling;
    }

    items.push(
      normalizeCard(
        {
          type: 'novels',
          slug,
          title: title || slug,
          cover,
          rating: null,
          description: null,
          genres: [],
        },
        lang,
      ),
    );
  });

  const pageNumbers: number[] = [];
  $(`a[href*="/novels/category/${genre}/"]`).each((_: number, element: any) => {
    const match = ($(element).attr('href') || '').match(new RegExp(`/novels/category/${genre}/(\\d+)$`));
    if (match) pageNumbers.push(Number(match[1]));
  });
  const totalPages = Math.max(currentPage, ...pageNumbers);
  const hasNext = $('a[rel="next"]').length > 0 || currentPage < totalPages;

  return { genre, page: currentPage, total_pages: totalPages, has_next: hasNext, items };
}

export async function search(
  query: string,
  type = 'series',
  page = 1,
  pageSize = 12,
  lang = DEFAULT_LANG,
): Promise<SearchResult> {
  const currentPage = Math.max(1, page);
  const payload = await request(searchApiUrl(lang, query, type, currentPage, pageSize), { json: true });
  const data = payload?.data || {};
  const items = (data.page_data || [])
    .map((item: any) => mapSearchItem(item, type, lang))
    .filter(Boolean) as MediaCard[];

  return {
    query,
    type,
    page: currentPage,
    page_size: pageSize,
    total: data.total_count ?? items.length,
    total_pages: data.total_pages ?? 1,
    type_counts: data.type_counts || {},
    items,
  };
}

/** Cari cover lewat API search untuk satu slug (dipakai saat HTML tak memuat gambar). */
async function lookupCover(lang: string, slug: string, title: string | null): Promise<string | null> {
  const q = (title || slug)
    .replace(/[()[\]（）「」]+/g, ' ')
    .replace(/[-_]+/g, ' ')
    .trim();
  if (!q) return null;
  try {
    const res = await search(q, 'series', 1, 10, lang);
    const hit = res.items.find((i) => i.slug === slug);
    return hit?.cover || null;
  } catch {
    return null;
  }
}

/**
 * Lengkapi cover yang kosong (mis. widget "Drama Pendek Per Genre" di halaman
 * peringkat yang hanya berisi tautan teks tanpa <img>). Pencarian paralel
 * dibatasi per kelompok agar tidak membanjiri upstream.
 */
export async function fillMissingCovers(items: MediaCard[], lang = DEFAULT_LANG): Promise<MediaCard[]> {
  const missing = items.filter((i) => !i.cover && i.type === 'series').slice(0, 24);
  if (!missing.length) return items;

  const map = new Map<string, string | null>();
  const CHUNK = 6;
  for (let i = 0; i < missing.length; i += CHUNK) {
    const batch = missing.slice(i, i + CHUNK);
    await Promise.all(
      batch.map(async (m) => {
        map.set(m.slug, await lookupCover(lang, m.slug, m.title));
      }),
    );
  }

  return items.map((i) => {
    if (i.cover) return i;
    const cover = map.get(i.slug);
    return cover ? { ...i, cover } : i;
  });
}

async function getSeriesInner(slug: string, episode: number | null = null, lang = DEFAULT_LANG): Promise<SeriesDetail> {
  // Rantai bahasa: judul terbaru sering belum dilokalkan ke `lang` —
  // coba bahasa lain sampai detail ketemu (prinsip union lintas bahasa).
  let detail: any = null;
  const langs = Array.from(new Set([lang, 'en', 'pt', 'jp']));
  const tries = await Promise.allSettled(
    langs.map((L) => request(apiUrl(L, slug, episode ?? 1), { json: true })),
  );
  for (const t of tries) {
    if (t.status !== 'fulfilled') continue;
    const d = (t.value as any)?.data?.[0];
    if (d && (d.series_slug || d.name)) {
      detail = d;
      break;
    }
  }
  if (!detail || (!detail.series_slug && !detail.name)) {
    const err: any = new Error('SERIES_NOT_FOUND');
    err.status = 404;
    throw err;
  }

  const rawEpisodes: any[] = detail.episode_list || detail.episodes || [];
  const episodeCount = detail.episode_num ?? rawEpisodes.length;

  // Episode yang benar-benar tersedia = punya URL di jendela rilis hulu.
  // Dub lain (en/pt/jp) sering lebih maju dari id — gabungkan semua bahasa
  // supaya tidak ada episode yang "terkunci" di aplikasi kita.
  const windowMax = (list: any[]): number =>
    (list || []).reduce((m: number, e: any) => (e?.url && Number(e.episode_id) > m ? Number(e.episode_id) : m), 0);

  let availableCount = windowMax(rawEpisodes);
  const langList: string[] = Array.from(new Set(String(detail.langs || '').match(/[a-z]{2}(?:-[a-z]{2})?/gi) || [])).slice(0, 5);
  if (availableCount < episodeCount && langList.length) {
    const windows = await Promise.all(
      langList
        .filter((l) => l.toLowerCase() !== lang.toLowerCase())
        .map(async (l) => {
          try {
            const p = await request(apiUrl(l, slug, 1), { json: true });
            return windowMax(p?.data?.[0]?.episode_list || []);
          } catch {
            return 0;
          }
        }),
    );
    availableCount = Math.max(availableCount, ...windows);
  }
  if (episodeCount > 0) availableCount = Math.min(Math.max(availableCount, 0), episodeCount);

  // Koreksi tepi ketersediaan: daftar episode di API sering ketinggalan
  // dari stream yang sudah benar-benar rilis. Probe langsung beberapa
  // episode di depan batas — yang ternyata ada, dinyatakan terbuka.
  if (episodeCount > 0 && availableCount < episodeCount) {
    const probe = async (n: number): Promise<number | null> => {
      try {
        await getSignedStream(slug, n);
        return n;
      } catch {
        return null;
      }
    };
    const start = availableCount;
    const upper = Math.min(episodeCount, start + 12);
    let frontier = start;
    for (let batchStart = start + 1; batchStart <= upper; batchStart += 4) {
      const batch: number[] = [];
      for (let n = batchStart; n <= Math.min(batchStart + 3, upper); n += 1) batch.push(n);
      const results = await Promise.all(batch.map(probe));
      const hit = results.filter((x): x is number => x !== null);
      if (hit.length === 0) break; // tidak ada yang rilis lagi
      frontier = Math.max(frontier, ...hit);
    }
    availableCount = frontier;
  }

  const episodes: EpisodeInfo[] = Array.from({ length: episodeCount }, (_, i) => ({
    episode_id: i + 1,
    title: `Episode ${i + 1}`,
    playable: i + 1 <= availableCount,
  }));

  const mapRec = (list: any): MediaCard[] =>
    (list || [])
      .map((item: any) => {
        if (item?.series_slug) {
          return normalizeCard(
            {
              type: 'series',
              slug: item.series_slug,
              title: item.name || null,
              cover: item.cover_url || null,
              rating: item.rating || null,
              episode_count: item.episode_num ?? null,
              description: item.short_desc || item.desc || null,
              genres: normalizeGenres(item.genre_list),
            },
            lang,
          );
        }
        if (item?.novels_slug) {
          return normalizeCard(
            {
              type: 'novels',
              slug: item.novels_slug,
              title: item.name || null,
              cover: item.cover_url || null,
              rating: item.rating || null,
              episode_count: item.episode_num ?? null,
              description: item.short_desc || null,
              genres: normalizeGenres(item.genre_list),
            },
            lang,
          );
        }
        return null;
      })
      .filter(Boolean) as MediaCard[];

  const articles: MediaCard[] = (detail.recommend_article_slugs_play || [])
    .map((item: any) =>
      item?.article_slug
        ? normalizeCard(
            {
              type: 'article',
              slug: item.article_slug,
              title: item.title || null,
              cover: item.banner || null,
              description: item.content_abstract || null,
              publish_date: item.publish_date || null,
              genres: [],
            },
            lang,
          )
        : null,
    )
    .filter(Boolean) as MediaCard[];

  const dubbedVersions: { language: string | null; platform: string | null; url: string | null }[] = [];
  const seenVersions = new Set<string>();
  for (const item of detail.watch_list || []) {
    const key = `${item.language}|${item.web_url}`;
    if (seenVersions.has(key)) continue;
    seenVersions.add(key);
    dubbedVersions.push({
      language: item.language || null,
      platform: item.web_name || null,
      url: item.web_url || null,
    });
  }

  let faq: { question: string; answer: string }[] | null = null;
  if (detail.faq) {
    try {
      const parsed = typeof detail.faq === 'string' ? JSON.parse(detail.faq) : detail.faq;
      if (Array.isArray(parsed)) {
        faq = parsed.map((f: any) => ({ question: f.question || f.q || '', answer: f.answer || f.a || '' }));
      }
    } catch {
      faq = null;
    }
  }

  return {
    series_slug: detail.series_slug || slug,
    title: detail.name || null,
    description: detail.desc || null,
    short_description: detail.short_desc || null,
    cover: detail.cover_url || null,
    photos: (detail.photo_list || '').split(',').map((p: string) => p.trim()).filter(Boolean),
    rating: detail.rating || null,
    reviewers: detail.reviewers_num ?? null,
    episode_count: episodeCount,
    release_date: detail.release_date || null,
    country: detail.country_of_origin || null,
    languages: (detail.langs || '').split(',').map((l: string) => l.trim()).filter(Boolean),
    genres: normalizeGenres(detail.genre_list),
    cast: detail.actor_list || [],
    story_plot: detail.story_plot ?? null,
    review_text: detail.review_text ?? null,
    faq,
    seo_title: detail.seo_title ?? null,
    seo_desc: detail.seo_desc ?? null,
    dubbed_versions: dubbedVersions,
    recommendations: mapRec(detail.recommend_series_slugs_play),
    platform_series: mapRec(detail.platform_series_list),
    recommended_articles: articles,
    episodes,
    availableCount,
    source_url: seriesUrl(lang, detail.series_slug || slug),
  };
}


const getSeriesCached = unstable_cache(getSeriesInner, ['melolo:getSeries'], { revalidate: 600 });

/** Versi ter-cache (10 menit) — aman untuk render berulang. */
export async function getSeries(slug: string, episode: number | null = null, lang = DEFAULT_LANG): Promise<SeriesDetail> {
  return (await getSeriesCached(slug, episode, lang)) as SeriesDetail;
}
export interface NovelDetail {
  novels_slug: string;
  title: string | null;
  cover: string | null;
  rating: string | null;
  episode_count: number | null;
  /** Total bab keseluruhan. */
  total_chapters: number | null;
  /** Bab yang benar-benar bisa dibaca di sumber (semua tampil & bisa dibaca). */
  available_chapters: number;
  description: string | null;
  genres: Genre[];
  source_url: string;
  android_url: string | null;
  apple_url: string | null;
}

export async function getNovel(slug: string, lang = DEFAULT_LANG): Promise<NovelDetail> {
  const payload = await requestFresh(novelApiUrl(lang, slug));
  const detail = payload?.data?.[0];
  if (!detail) {
    const err: any = new Error('NOVEL_NOT_FOUND');
    err.status = 404;
    throw err;
  }
  const total = detail.episode_num ?? null;
  const available = Math.max(
    0,
    Math.min(
      Number(detail.episode?.total) || (detail.episode?.episode_1 ? 1 : 0),
      total ?? (Number(detail.episode?.total) || 0),
    ),
  );
  return {
    novels_slug: detail.novels_slug || slug,
    title: detail.name || null,
    cover: detail.cover_url || null,
    rating: detail.rating || null,
    episode_count: total,
    total_chapters: total,
    available_chapters: available,
    description: detail.short_desc || detail.desc || null,
    genres: normalizeGenres(detail.genre_list),
    source_url: novelUrl(lang, slug),
    android_url: detail.android_url || null,
    apple_url: detail.apple_url || null,
  };
}

export interface NovelChapter {
  novels_slug: string;
  chapter: number;
  title: string | null;
  paragraphs: string[];
}

/**
 * Ambil teks satu bab novel dari halaman baca resmi (client-render penuh).
 * Bab yang belum tersedia di sumber akan melempar NOVEL_CHAPTER_NOT_FOUND (404).
 */
export async function getNovelChapter(slug: string, chapter: number, lang = DEFAULT_LANG): Promise<NovelChapter> {
  if (!Number.isFinite(chapter) || chapter < 1) {
    const err: any = new Error('NOVEL_CHAPTER_NOT_FOUND');
    err.status = 404;
    throw err;
  }

  let html: string;
  try {
    html = await request(pageUrl(lang, `/novels/${slug}/chapter-${chapter}`));
  } catch {
    const err: any = new Error('NOVEL_CHAPTER_NOT_FOUND');
    err.status = 404;
    throw err;
  }

  const $ = cheerio.load(html);
  const paragraphs: string[] = [];
  $('.text-cont p').each((_: number, el: any) => {
    const t = $(el).text().replace(/\s+/g, ' ').trim();
    if (t) paragraphs.push(t);
  });
  if (!paragraphs.length) {
    const err: any = new Error('NOVEL_CHAPTER_NOT_FOUND');
    err.status = 404;
    throw err;
  }

  const title = $('h2').first().text().replace(/\s+/g, ' ').trim() || `Bab ${chapter}`;
  return { novels_slug: slug, chapter, title, paragraphs };
}

/**
 * Ambil URL stream signed untuk satu episode (berlaku ~300 detik).
 * Pencocokan KETAT berdasarkan episode_id — tidak pernah mengambil URL
 * episode lain, lalu mencoba bahasa lain (en/pt/jp) bila dub id belum rilis.
 */
export async function getSignedStream(slug: string, episode: number, lang = DEFAULT_LANG): Promise<SignedStream> {
  if (!Number.isFinite(episode) || episode < 1) {
    const err: any = new Error('EPISODE_NOT_FOUND');
    err.status = 404;
    err.detail = { episode, total: 0 };
    throw err;
  }

  const langsToTry = [lang, 'en', 'pt', 'jp'].filter((l, i, arr) => arr.indexOf(l) === i);
  let total = 0;
  let sawSeries = false;

  for (const l of langsToTry) {
    let detail: any;
    try {
      const payload = await requestFresh(apiUrl(l, slug, episode));
      detail = payload?.data?.[0];
    } catch {
      continue;
    }
    if (!detail) continue;
    sawSeries = true;
    const rawEpisodes: any[] = detail.episode_list || detail.episodes || [];
    total = Math.max(total, detail.episode_num ?? rawEpisodes.length);
    // Pilih HANYA episode yang id-nya persis sama — fallback indeks dihapus
    // agar video yang diputar selalu cocok dengan nomor episode yang tampil.
    const target = rawEpisodes.find((e: any) => Number(e.episode_id) === episode && typeof e.url === 'string');
    const url = target?.url || null;
    if (url && url.includes('sign=')) {
      return {
        series_slug: detail.series_slug || slug,
        episode_id: episode,
        stream_url: url,
        expires_in: 300,
      };
    }
  }

  if (!sawSeries) {
    const err: any = new Error('SERIES_NOT_FOUND');
    err.status = 404;
    throw err;
  }
  const err: any = new Error('EPISODE_NOT_SIGNED');
  err.status = 404;
  err.detail = { episode, total };
  throw err;
}

/**
 * Lengkapi card yang masih kekurangan metadata (episode_count/description)
 * dengan memanggil API detail — dipakai untuk item hero (jumlah kecil).
 */
export async function enrichCards(items: MediaCard[], lang = DEFAULT_LANG): Promise<MediaCard[]> {
  return Promise.all(
    items.map(async (item) => {
      if (item.type !== 'series' || (item.episode_count !== null && item.description)) return item;
      try {
        const detail = await getSeries(item.slug, null, lang);
        return {
          ...item,
          episode_count: item.episode_count ?? detail.episode_count,
          description: item.description || detail.short_description || detail.description,
          genres: item.genres.length ? item.genres : detail.genres,
          rating: item.rating || detail.rating,
        };
      } catch {
        return item;
      }
    }),
  );
}

/* ------------------------------------------------------------------ BARU TAYANG */

export interface NewSeriesItem {
  slug: string;
  title: string | null;
  cover: string | null;
  rating: string | null;
  episode_count: number | null;
  description: string | null;
  genres: Genre[];
  /** tanggal konten terakhir diperbarui (sitemap lastmod) — bukti "real time" */
  updated: string | null;
  create_time: string | null;
}

/**
 * "BARU TAYANG" — rilisan & pembaruan terbaru dari katalog melolo,
 * diurutkan dari `lastmod` sitemap (diperbarui harian oleh sumber).
 * Real-time: cache 30 menit, otomatis mengikuti update melolo.
 */
export async function getNewSeries(limit = 24, lang = DEFAULT_LANG): Promise<NewSeriesItem[]> {
  const res = await fetch(`${BASE}/sitemap/movie.xml`, {
    headers: { 'User-Agent': UA },
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`sitemap HTTP ${res.status}`);
  const xml = await res.text();

  const entries: { slug: string; updated: string | null }[] = [];
  const re = /<loc>[^<]*\/dramas\/([^<]+)<\/loc>[\s\S]*?<lastmod>([^<]*)<\/lastmod>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const slug = m[1].replace(/\/$/, '').trim();
    if (slug) entries.push({ slug, updated: m[2].trim() || null });
  }
  entries.sort((a, b) => (b.updated || '').localeCompare(a.updated || ''));
  const top = entries.slice(0, limit);

  // perkaya ringan — sumber membatasi ledakan paralel: pool kecil + jeda.
  // Judul terbaru bisa belum dilokalkan ke `lang` → fallback ke 'en'.
  const out: NewSeriesItem[] = [];
  const queue = [...top];
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const fetchLight = async (slug: string): Promise<any | null> => {
    for (const L of Array.from(new Set([lang, 'en', 'pt', 'jp', 'es', 'fr', 'de', 'th']))) {
      try {
        const r = await fetch(
          `${BASE}/api/series/getSeriesBySlug?language=${L}&series_slug=${slug}&pageType=detail&episode_id=1`,
          { headers: { 'User-Agent': UA }, next: { revalidate: 1800 } },
        );
        const json = await r.json();
        const d: any = Array.isArray(json?.data) ? json.data[0] : json?.data;
        if (d?.series_slug) return d;
      } catch {
        /* coba bahasa berikutnya */
      }
      await sleep(150);
    }
    return null;
  };
  const worker = async () => {
    while (queue.length) {
      const e = queue.shift()!;
      const d = await fetchLight(e.slug);
      if (d?.series_slug) {
        out.push({
          slug: d.series_slug,
          title: d.name ?? null,
          cover: d.cover_url ?? null,
          rating: d.rating != null ? String(d.rating) : null,
          episode_count: d.episode_num != null ? Number(d.episode_num) : null,
          description: d.short_desc ?? d.desc ?? null,
          genres: (d.genre_list || []).map((g: any) => ({ slug: g.genre_slug ?? null, name: g.name ?? '' })),
          updated: e.updated,
          create_time: d.create_time ?? null,
        });
      }
      await sleep(120);
    }
  };
  await Promise.all(Array.from({ length: 3 }, worker));
  // pertahankan urutan lastmod terbaru
  out.sort((a, b) => (b.updated || '').localeCompare(a.updated || ''));
  return out;
}

/* ------------------------------------------------------------------ KURASI KATALOG */

/**
 * Urutan genre: THRILLER selalu di posisi #1 (permintaan), sisanya urutan sumber.
 */
export function orderGenres<T extends { slug: string | null }>(genres: T[]): T[] {
  return [...genres].sort((a, b) => (a.slug === 'thriller' ? 0 : 1) - (b.slug === 'thriller' ? 0 : 1));
}

/**
 * Kurasi kartu katalog: buang duplikat (slug sama), tampilkan yang "keren"
 * (rating tinggi + cover + sinopsis) ke depan. `preserveOrder` menjaga urutan
 * bermakna (peringkat resmi / rilisan terbaru).
 */
export function curateCards(items: MediaCard[], opts: { preserveOrder?: boolean } = {}): MediaCard[] {
  const seen = new Set<string>();
  const out: MediaCard[] = [];
  for (const it of items) {
    if (!it.slug || seen.has(it.slug)) continue;
    seen.add(it.slug);
    out.push(it);
  }
  if (opts.preserveOrder) return out;
  const score = (it: MediaCard) =>
    (parseFloat(it.rating || '0') || 0) * 10 +
    (it.cover ? 50 : 0) +
    (it.description ? 10 : 0) +
    (it.episode_count ? 5 : 0);
  return out
    .map((it, i) => ({ it, i, s: score(it) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.it);
}

/** Normalisasi judul untuk deteksi kembar lintas sumber. */
export function normTitle(t: string | null | undefined): string {
  return (t || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Lengkapi rail sampai `target` item: buang kembar (via `seen`) lalu tambahkan
 * isi genre terkait sampai penuh — pilihan tetap banyak saat digeser.
 */
export async function fillRail(
  items: MediaCard[],
  seen: Set<string>,
  target = 22,
  lang = DEFAULT_LANG,
): Promise<MediaCard[]> {
  // item dasar diasumsikan sudah lolos dedup — langsung dipakai
  const out: MediaCard[] = [...items];
  if (out.length >= target) return out;

  const genres = new Map<string, string>();
  for (const it of out) for (const g of it.genres) if (g.slug) genres.set(g.slug, g.name);

  for (const slug of genres.keys()) {
    if (out.length >= target) break;
    try {
      const cat = await getCategory(slug, 1, lang);
      for (const it of cat.items) {
        if (out.length >= target) break;
        if (seen.has(it.slug)) continue;
        seen.add(it.slug);
        out.push(it);
      }
    } catch {
      /* genre dilewati */
    }
  }
  return out;
}

/** bersihkan nama sumber dari teks yang tampil ke pengguna */
export function scrubSource(s: string): string {
  return (s || '').replace(/\b(melolo\.com|melolo|reelshort|flickreels|drakorku|dramaboxdb\.com|dramabox)\b/gi, 'DramaKu');
}
