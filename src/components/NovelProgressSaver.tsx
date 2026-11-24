'use client';

import { useEffect } from 'react';
import { saveNovelProgress } from '@/lib/store';

/** Simpan progres baca (bab terakhir) tiap halaman bab dibuka. */
export default function NovelProgressSaver({ slug, chapter, title }: { slug: string; chapter: number; title: string | null }) {
  useEffect(() => {
    saveNovelProgress(slug, chapter, title);
    window.dispatchEvent(new CustomEvent('dramaku:store', { detail: 'dramaku:novel' }));
  }, [slug, chapter, title]);

  return null;
}
