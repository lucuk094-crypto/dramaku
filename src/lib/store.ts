'use client';

/**
 * Penyimpanan favorit & riwayat tontonan (mode tamu).
 * Default: localStorage per perangkat.
 * Supabase-ready: jalankan `supabase/schema.sql` lalu isi env NEXT_PUBLIC_SUPABASE_URL
 * & NEXT_PUBLIC_SUPABASE_ANON_KEY — lihat README bagian "Menghubungkan Supabase".
 */

export interface FavItem {
  slug: string;
  title: string | null;
  cover: string | null;
  rating: string | null;
  episode_count: number | null;
  added_at: number;
  /** jenis konten: 'series' | 'novels' | 'dramabox' — penentu tautan di halaman Favorit */
  type?: 'series' | 'novels' | 'dramabox';
}

export interface HistoryItem {
  slug: string;
  title: string | null;
  cover: string | null;
  episode: number;
  episode_count: number | null;
  position: number;
  duration: number;
  updated_at: number;
  /** tautan lanjut tonton (untuk sumber selain serial utama) */
  url?: string;
  /** asal sumber: 'reel' | 'asia' | dsb. */
  src?: string;
}

const FAV_KEY = 'dramaku:favorites';
const HIST_KEY = 'dramaku:history';

function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('dramaku:store', { detail: key }));
  } catch {
    /* kuota penuh — abaikan */
  }
}

/* ------------------------------------------------------------- favorites */

export function getFavorites(): FavItem[] {
  return read<FavItem>(FAV_KEY);
}

export function isFavorite(slug: string): boolean {
  return getFavorites().some((f) => f.slug === slug);
}

export function toggleFavorite(item: Omit<FavItem, 'added_at'>): boolean {
  const list = getFavorites();
  const idx = list.findIndex((f) => f.slug === item.slug);
  if (idx >= 0) {
    list.splice(idx, 1);
    write(FAV_KEY, list);
    return false;
  }
  list.unshift({ ...item, added_at: Date.now() });
  write(FAV_KEY, list.slice(0, 300));
  return true;
}

export function removeFavorite(slug: string) {
  write(FAV_KEY, getFavorites().filter((f) => f.slug !== slug));
}

/* --------------------------------------------------------------- history */

export function getHistory(): HistoryItem[] {
  return read<HistoryItem>(HIST_KEY).sort((a, b) => b.updated_at - a.updated_at);
}

export function getProgress(slug: string): HistoryItem | null {
  return getHistory().find((h) => h.slug === slug) || null;
}

export function saveProgress(item: Omit<HistoryItem, 'updated_at'>) {
  if (!item.slug || !Number.isFinite(item.position)) return;
  const list = getHistory().filter((h) => !(h.slug === item.slug && h.episode === item.episode));
  list.unshift({ ...item, updated_at: Date.now() });
  write(HIST_KEY, list.slice(0, 100));
}

export function removeHistory(slug: string) {
  write(HIST_KEY, getHistory().filter((h) => h.slug !== slug));
}

export function clearHistory() {
  write(HIST_KEY, []);
}

/* ------------------------------------------------------- novel progress */

const NOVEL_KEY = 'dramaku:novel';

export interface NovelProgress {
  slug: string;
  chapter: number;
  title: string | null;
  updated_at: number;
}

export function getNovelProgress(slug: string): NovelProgress | null {
  return read<NovelProgress>(NOVEL_KEY)
    .filter((n) => n.slug === slug)
    .sort((a, b) => b.updated_at - a.updated_at)[0] || null;
}

export function saveNovelProgress(slug: string, chapter: number, title: string | null = null) {
  if (!slug || !Number.isFinite(chapter)) return;
  const list = read<NovelProgress>(NOVEL_KEY).filter((n) => n.slug !== slug);
  list.unshift({ slug, chapter, title, updated_at: Date.now() });
  write(NOVEL_KEY, list.slice(0, 100));
}
