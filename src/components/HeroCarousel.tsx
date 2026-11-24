'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MediaCard } from '@/lib/melolo';
import { IconPlay, IconStar } from './Icons';
import { scrubSource } from '@/lib/melolo';

const AUTO_MS = 7000;
const EASE = [0.23, 1, 0.32, 1] as const;

/** Hero instrumen versi ringkas: judul padat, poster kecil, readout rapat. */
export default function HeroCarousel({ items }: { items: MediaCard[] }) {
  const slides = items.slice(0, 5);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    timer.current = setTimeout(() => setIndex((i) => (i + 1) % slides.length), AUTO_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [index, paused, slides.length]);

  if (!slides.length) return null;
  const current = slides[index];

  return (
    <section
      className="panel overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {/* latar blur */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`bg-${current.slug}-${index}`}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          {current.cover && (
            <img
              src={current.cover}
              alt=""
              aria-hidden
              className="h-full w-full scale-110 object-cover opacity-[0.30] blur-2xl"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-card via-card/85 to-card/40" />
        </motion.div>
      </AnimatePresence>

      <div className="relative grid grid-cols-[minmax(0,1fr)_110px] items-center gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_150px] sm:gap-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_180px] lg:gap-8 lg:p-8">
        {/* kiri: teks */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`text-${index}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.42, ease: EASE }}
            className="min-w-0"
          >
            <p className="eyebrow">
              Sorotan — {String(index + 1).padStart(2, '0')}/{String(slides.length).padStart(2, '0')}
            </p>

            <h1 className="mt-2.5 text-xl font-medium leading-[1.1] tracking-tightest sm:text-2xl lg:text-3xl">
              {current.title}
            </h1>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
              {current.rating && (
                <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-mono text-accent">
                  <IconStar className="h-3.5 w-3.5" /> {current.rating}
                </span>
              )}
              {current.episode_count !== null && (
                <span className="font-mono text-[11px] uppercase tracking-mono text-soft">
                  {current.episode_count} · Episode
                </span>
              )}
            </div>

            {current.description && (
              <p className="mt-2.5 line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted">
                {scrubSource(current.description)}
              </p>
            )}

            {current.genres?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {current.genres.slice(0, 4).map((g) => (
                  <Link key={g.slug || g.name} href={`/genres/${g.slug}`} className="chip">
                    {g.name}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link href={`/watch/${current.slug}/1`} className="btn btn-main btn-sm focus-ring">
                <IconPlay className="h-3.5 w-3.5" />
                Tonton Sekarang
              </Link>
              <Link href={`/series/${current.slug}`} className="btn btn-ghost btn-sm focus-ring">
                Lihat Detail
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* kanan: poster */}
        <div className="relative mx-auto w-[110px] sm:w-[150px] lg:w-[180px]">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={`poster-${current.slug}-${index}`}
              initial={{ opacity: 0, y: 16, rotate: 1.5 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, y: -12, rotate: -1.5 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="panel panel-hover relative overflow-hidden"
            >
              {current.cover ? (
                <img src={current.cover} alt={current.title} className="aspect-[2/3] w-full object-cover" />
              ) : (
                <div className="flex aspect-[2/3] w-full items-center justify-center bg-accent-bg text-3xl font-black text-accent">
                  {(current.title || '?')[0]}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* readout instrumen — rapat */}
      <div className="relative flex flex-wrap items-center justify-between gap-x-5 gap-y-1.5 border-t border-border/[var(--border-alpha)] px-5 py-2.5 sm:px-8">
        <p className="mono text-soft">
          Status <b className="mono-accent font-normal">Streaming gratis</b>
        </p>
        <p className="mono text-soft">
          Episode <b className="mono-accent font-normal">{current.episode_count ?? '—'}</b>
        </p>
        <p className="mono text-soft">
          Rating <b className="mono-accent font-normal">{current.rating ?? '—'}</b>
        </p>

        {/* indikator */}
        {slides.length > 1 && (
          <div className="flex items-center gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide.slug}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className="group relative h-[3px] overflow-hidden rounded-sm bg-tick/50 transition-all"
                style={{ width: i === index ? 30 : 12 }}
              >
                {i === index && (
                  <motion.span
                    key={`bar-${index}-${paused}`}
                    className="absolute inset-0 bg-accent"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: paused ? 0 : AUTO_MS / 1000, ease: 'linear' }}
                    style={{ transformOrigin: 'left' }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
