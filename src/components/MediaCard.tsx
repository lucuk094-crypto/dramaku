'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { MediaCard } from '@/lib/melolo';
import { scrubSource } from '@/lib/melolo';
import { IconExternal, IconPlay, IconQuote, IconStar, IconX } from './Icons';

interface Props {
  item: MediaCard;
  index?: number;
  showRank?: boolean;
  wide?: boolean;
  /** isi lebar sel grid (tanpa lebar tetap) */
  fluid?: boolean;
}

/**
 * Kartu media — gaya animasi carousel yang diminta:
 *  - hover 3D (rotateX/Y + rotate + scale)
 *  - klik → kartu MEMBESAR jadi panel detail (shared-layout, backdrop blur,
 *    Escape / klik luar untuk menutup, kunci scroll body)
 *  - judul & genre "morph" mulus antara kartu dan panel
 */
export default function MediaCard({ item, index = 0, showRank = false, wide = false, fluid = false }: Props) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const panelRef = useRef<HTMLDivElement>(null);

  const isSeries = item.type === 'series';
  const href = isSeries ? `/series/${item.slug}` : `/novels/${item.slug}`;
  const cta = isSeries ? 'Tonton Sekarang' : 'Baca Sekarang';
  const genres = item.genres.map((g) => g.name).filter(Boolean);
  const genreLine = genres.join(' · ') || (isSeries ? 'Drama' : 'Novel');

  useEffect(() => setMounted(true), []);

  const open = () => setExpanded(true);
  const close = () => setExpanded(false);

  // Escape + kunci scroll body saat panel terbuka
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    if (expanded) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.body.dataset.scrollY = String(scrollY);
    } else {
      const scrollY = Number.parseInt(document.body.dataset.scrollY || '0', 10);
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  // klik di luar panel → tutup
  useEffect(() => {
    if (!expanded) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [expanded]);

  return (
    <>
      {/* ===== panel detail yang membesar (portal ke body: bebas ancestor ber-transform) ===== */}
      {mounted &&
        createPortal(
          <AnimatePresence>
        {expanded && (
          <div className="fixed inset-0 z-[70] overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/55 backdrop-blur-lg"
            />
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.38, ease: [0.23, 1, 0.32, 1] }}
              className="relative z-[80] mx-auto flex min-h-full w-full max-w-3xl flex-col md:my-10 md:min-h-0 md:rounded-3xl border border-border bg-card p-5 shadow-panel md:p-10"
            >
              <button
                type="button"
                onClick={close}
                aria-label="Tutup"
                className="focus-ring sticky right-0 top-0 ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-[rgb(var(--fg))] text-[rgb(var(--bg))] transition hover:opacity-80"
              >
                <IconX className="h-4 w-4" />
              </button>

              <div className="mt-2 flex flex-col gap-6 md:flex-row md:gap-10">
                <div className="panel mx-auto w-full max-w-[240px] shrink-0 overflow-hidden md:mx-0">
                  {item.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.cover} alt={item.title || item.slug} className="aspect-[3/4] w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[3/4] w-full items-center justify-center bg-accent-bg text-4xl font-black text-accent/50">
                      {(item.title || '?')[0]}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <motion.p
                    className="font-serif text-base italic tracking-wide text-muted underline decoration-1 underline-offset-8"
                  >
                    {genreLine}
                  </motion.p>

                  <motion.h2
                    className="mt-4 text-2xl font-normal leading-tight tracking-tightest md:text-4xl"
                  >
                    {item.title}
                  </motion.h2>

                  <p className="mt-3 font-mono text-xs uppercase tracking-mono text-soft">
                    {item.rating ? `★ ${item.rating}` : ''}
                    {item.episode_count ? ` · ${item.episode_count} Episode` : ''}
                    {item.publish_date ? ` · ${item.publish_date}` : ''}
                  </p>

                  <div className="mt-6 font-serif text-lg italic leading-snug tracking-wide text-muted">
                    <IconQuote className="h-5 w-5 text-accent" />
                    <p className="mt-2">
                      {item.description?.trim()
                        ? scrubSource(item.description)
                        : 'Sinopsis belum tersedia untuk judul ini — tekan tombol di bawah untuk menonton langsung.'}
                    </p>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-2">
                    <Link href={href} className="btn btn-main focus-ring" onClick={close}>
                      <IconPlay className="h-4 w-4" />
                      {cta}
                    </Link>
                    <button type="button" onClick={close} className="btn btn-ghost focus-ring">
                      Kembali
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
          </AnimatePresence>,
          document.body,
        )}

      {/* ===== kartu (hover 3D → klik membesar; tautan asli agar tetap bisa dibuka tanpa JS) ===== */}
      <motion.a
        href={href}
        onClick={(e) => {
          e.preventDefault();
          open();
        }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '40px' }}
        transition={{ duration: 0.5, delay: Math.min(0.1 * (index % 8), 0.8), ease: [0.23, 1, 0.32, 1] }}
        whileHover={{
          rotateX: 2,
          rotateY: 2,
          rotate: 2,
          scale: 1.02,
          transition: { duration: 0.3, ease: 'easeOut' },
        }}
        style={{ transformPerspective: 900 }}
        aria-label={item.title || item.slug}
        className={`focus-ring group block rounded text-left ${
          fluid
            ? 'w-full min-w-0'
            : wide
              ? 'w-[210px] shrink-0 sm:w-[240px]'
              : 'w-[150px] shrink-0 sm:w-[170px]'
        }`}
      >
        <div className="media-poster">
          {item.cover ? (
            <img
              src={item.cover}
              alt={item.title || item.slug}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              className={`img-fade ${imgLoaded ? 'img-loaded' : ''}`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-accent-bg">
              <span className="text-3xl font-black text-accent/50">{(item.title || '?')[0]}</span>
            </div>
          )}
          <div className="veil" />

          {showRank && item.rank !== null && item.rank !== undefined && (
            <div className="absolute left-2 top-2 rounded-sm bg-accent px-2 py-0.5 font-mono text-[11px] font-medium tracking-mono text-[rgb(var(--btn-text))]">
              #{item.rank}
            </div>
          )}

          {!isSeries && (
            <div className="absolute right-2 top-2 flex items-center gap-1 rounded-sm bg-black/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-mono text-white">
              {item.type === 'novels' ? 'Novel' : item.type}
              <IconExternal className="h-2.5 w-2.5" />
            </div>
          )}

          {item.episode_count !== null && item.episode_count !== undefined && (
            <div className="absolute bottom-2 left-2 rounded-sm bg-black/55 px-2 py-0.5 font-mono text-[10px] uppercase tracking-mono text-white">
              {item.episode_count} Ep
            </div>
          )}

          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-[rgb(var(--btn-text))] shadow-lg">
              <IconPlay className="h-4 w-4" />
            </div>
          </div>
        </div>

        <motion.p
          className="mt-2 line-clamp-2 text-sm font-medium leading-snug tracking-tight"
        >
          {item.title}
        </motion.p>
        <motion.p
          className="mt-1 truncate font-mono text-[10px] uppercase tracking-mono text-soft"
        >
          {item.rating ? `★ ${item.rating}` : ''}
          {item.rating && genreLine ? ' · ' : ''}
          {genreLine}
        </motion.p>
      </motion.a>
    </>
  );
}
