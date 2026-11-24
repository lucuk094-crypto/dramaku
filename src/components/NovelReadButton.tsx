'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getNovelProgress } from '@/lib/store';
import { IconBookmark } from './Icons';

/**
 * Tombol utama membaca novel — otomatis menawarkan "Lanjutkan Bab N"
 * bila ada progres baca tersimpan di perangkat ini.
 */
export default function NovelReadButton({ slug, availableChapters }: { slug: string; availableChapters: number }) {
  const [chapter, setChapter] = useState<number | null>(null);

  useEffect(() => {
    const p = getNovelProgress(slug);
    if (p && p.chapter >= 1 && p.chapter <= availableChapters) setChapter(p.chapter);
  }, [slug, availableChapters]);

  if (availableChapters < 1) {
    return (
      <span className="btn btn-ghost focus-ring cursor-not-allowed opacity-60" aria-disabled="true">
        <IconBookmark className="h-4 w-4" />
        Belum ada bab yang tersedia
      </span>
    );
  }

  return (
    <Link
      href={`/novels/${slug}/chapter/${chapter ?? 1}`}
      className="btn btn-main focus-ring"
    >
      <IconBookmark className="h-4 w-4" />
      {chapter ? `Lanjutkan Bab ${chapter}` : 'Mulai Membaca Bab 1'}
    </Link>
  );
}
