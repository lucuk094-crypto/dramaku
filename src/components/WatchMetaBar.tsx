'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Props {
  slug: string;
  title: string | null;
  initialEp: number;
  availableCount: number;
  episodeCount: number;
  rating: string | null;
  shortDescription: string | null;
}

/**
 * Baris judul + navigasi cepat di bawah feed. Nomor episode, tombol
 * sebelumnya/berikutnya, dan meta SELALU mengikuti episode yang sedang
 * diputar di feed (event `dramaku:episode`) — sinkron di semua tempat.
 * Penomoran memakai TOTAL episode (1..N lengkap).
 */
export default function WatchMetaBar({
  slug,
  title,
  initialEp,
  availableCount,
  episodeCount,
  rating,
  shortDescription,
}: Props) {
  const [ep, setEp] = useState(initialEp);

  useEffect(() => {
    const onEp = (e: Event) => {
      const detail = (e as CustomEvent).detail as { slug?: string; episode?: number };
      if (detail?.slug === slug && Number.isFinite(detail.episode)) setEp(Number(detail.episode));
    };
    window.addEventListener('dramaku:episode', onEp);
    return () => window.removeEventListener('dramaku:episode', onEp);
  }, [slug]);

  return (
    <div className="mt-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-medium leading-tight tracking-tightest">{title}</h1>
          <p className="mt-2 font-mono text-xs uppercase tracking-mono text-soft">
            Episode {ep} dari {episodeCount}
            {episodeCount > availableCount ? ` · ${availableCount} siap ditonton` : ''}
            {rating ? ` · Rating ${rating}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {ep > 1 && (
            <Link href={`/watch/${slug}/${ep - 1}`} className="btn btn-ghost focus-ring">
              ← Sebelumnya
            </Link>
          )}
          {ep < episodeCount && (
            <Link href={`/watch/${slug}/${ep + 1}`} className="btn btn-main focus-ring">
              Berikutnya →
            </Link>
          )}
        </div>
      </div>

      {shortDescription && <p className="mt-5 max-w-3xl leading-relaxed text-muted">{shortDescription}</p>}

      <Link href={`/series/${slug}`} className="go focus-ring mt-5 inline-flex rounded">
        Lihat detail lengkap
      </Link>
    </div>
  );
}
