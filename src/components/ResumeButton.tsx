'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getProgress } from '@/lib/store';

/** Tombol "Lanjutkan Episode N" bila ada progres tersimpan. */
export default function ResumeButton({ slug, episodeCount }: { slug: string; episodeCount: number }) {
  const [progress, setProgress] = useState<{ episode: number; position: number; duration: number } | null>(null);

  useEffect(() => {
    const saved = getProgress(slug);
    if (saved) setProgress(saved);
  }, [slug]);

  if (!progress) return null;

  return (
    <Link
      href={`/watch/${slug}/${progress.episode}`}
      className="btn btn-accent-ghost focus-ring"
    >
      Lanjutkan Episode {progress.episode}
    </Link>
  );
}
