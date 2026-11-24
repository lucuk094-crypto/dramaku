'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Props {
  name: string;
  slug: string;
  cover: string;
  meta?: string;
  genreLine?: string;
  badge?: string; // mis. "Tonton" / "Drakorku"
  href: string;
  index?: number;
  wide?: boolean;
  /** isi lebar sel grid (tanpa lebar tetap) */
  fluid?: boolean;
}

/**
 * Kartu serial Drakorku — seragam dengan kartu Melolo/ReelShort:
 * sampul selalu tampil + badge + meta, hover halus.
 */
export default function DkCard({ name, slug, cover, meta, genreLine, badge = 'Serial', href, index = 0, wide = false, fluid = false }: Props) {
  const [imgLoaded, setImgLoaded] = useState(false);
  return (
    <Link
      href={href}
      className={`group focus-ring block ${fluid ? 'w-full min-w-0' : wide ? 'w-[210px] shrink-0 sm:w-[240px]' : 'w-[150px] shrink-0 sm:w-[170px]'}`}
      style={{ animationDelay: `${Math.min(index, 11) * 45}ms` }}
      title={name}
    >
      <div className="media-poster relative overflow-hidden rounded-xl border border-[--border] bg-[--soft] shadow-panel">
        <div className={`${wide ? 'aspect-[16/9]' : 'aspect-[3/4]'} w-full`}>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={name}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.04] ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          ) : null}
          <div className="veil absolute inset-0" />
        </div>
        <span className="mono absolute left-2 top-2 rounded-md bg-[--accent] px-1.5 py-0.5 text-[10px] font-semibold text-[--accent-bg]">
          {badge}
        </span>
        {meta ? (
          <span className="mono absolute bottom-2 left-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] text-white/90">{meta}</span>
        ) : null}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-[--fg]">{name}</p>
      {genreLine ? <p className="mono mt-0.5 truncate text-[11px] uppercase tracking-wide text-[--muted]">{genreLine}</p> : null}
    </Link>
  );
}
