'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { RsBook } from '@/lib/reelshort';
import { IconPlay, IconQuote, IconX } from './Icons';
import { scrubSource } from '@/lib/melolo';

interface Props {
  item: RsBook;
  /** slug melolo bila judul tersedia untuk ditonton di DramaKu */
  meloloSlug?: string | null;
  index?: number;
  /** isi lebar sel grid (tanpa lebar tetap) */
  fluid?: boolean;
}

/**
 * Kartu katalog ReelShort — animasi carousel yang sama (hover 3D, klik →
 * panel membesar dengan blur + serif italic, Escape/klik luar menutup).
 * Judul yang tersedia di katalog kami punya aksi "Tonton"; selebihnya ke
 * halaman detail episode di aplikasi ini.
 */
export default function RsCard({ item, meloloSlug = null, index = 0, fluid = false }: Props) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const href = meloloSlug ? `/series/${meloloSlug}` : `/reelshort/tonton/${item.id}?ep=1`;
  const genreLine = item.tags.slice(0, 3).join(' · ') || 'Drama';

  const open = () => setExpanded(true);
  const close = () => setExpanded(false);

  useEffect(() => setMounted(true), []);

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
      {/* ===== panel detail membesar (portal ke body: bebas ancestor ber-transform) ===== */}
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
                  className="relative z-[80] mx-auto flex min-h-full w-full max-w-3xl flex-col border border-border bg-card p-5 shadow-panel md:my-10 md:min-h-0 md:rounded-3xl md:p-10"
                >
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Tutup"
                    className="focus-ring sticky right-0 top-0 ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-fg text-bg transition hover:opacity-80"
                  >
                    <IconX className="h-4 w-4" />
                  </button>

                  <div className="mt-2 flex flex-col gap-6 md:flex-row md:gap-10">
                    <div className="panel mx-auto w-full max-w-[240px] shrink-0 overflow-hidden md:mx-0">
                      {item.cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.cover} alt={item.title} className="aspect-[3/4] w-full object-cover" />
                      ) : (
                        <div className="flex aspect-[3/4] w-full items-center justify-center bg-accent-bg text-4xl font-black text-accent/50">
                          {(item.title || '?')[0]}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-base italic tracking-wide text-muted underline decoration-1 underline-offset-8">
                        {genreLine}
                      </p>

                      <h2 className="mt-4 text-2xl font-normal leading-tight tracking-tightest md:text-4xl">
                        {item.title}
                      </h2>

                      <p className="mt-3 font-mono text-xs uppercase tracking-mono text-soft">
                        {item.chapters ? `${item.chapters} Episode` : 'Katalog'}
                        {item.reads ? ` · ${item.reads.toLocaleString('id-ID')}x ditonton` : ''}
                        {' · Serial Pendek'}
                      </p>

                      <div className="mt-6 font-serif text-lg italic leading-snug tracking-wide text-muted">
                        <IconQuote className="h-5 w-5 text-accent" />
                        <p className="mt-2">
                          {scrubSource(item.desc || '').trim() ||
                            'Sinopsis belum tersedia untuk judul ini — buka halaman detail untuk daftar episode lengkap.'}
                        </p>
                      </div>

                      <div className="mt-8 flex flex-wrap items-center gap-2">
                        <Link href={href} className="btn btn-main focus-ring" onClick={close}>
                          <IconPlay className="h-4 w-4" />
                          {meloloSlug ? 'Tonton di DramaKu' : 'Tonton Sekarang'}
                        </Link>
                        <Link
                          href={`/reelshort/judul/${item.id}`}
                          className="btn btn-ghost focus-ring"
                          onClick={close}
                        >
                          Detail & Episode
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

      {/* ===== kartu (hover 3D → klik membesar) ===== */}
      <motion.button
        type="button"
        onClick={open}
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
        aria-label={item.title}
        className={`focus-ring group block rounded text-left ${fluid ? 'w-full min-w-0' : 'w-[150px] shrink-0 sm:w-[170px]'}`}
      >
        <div className="media-poster">
          {item.cover ? (
            <img
              src={item.cover}
              alt={item.title}
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

          {item.chapters > 0 && (
            <div className="absolute bottom-2 left-2 rounded-sm bg-black/55 px-2 py-0.5 font-mono text-[10px] uppercase tracking-mono text-white">
              {item.chapters} Ep
            </div>
          )}
          <div className="absolute right-2 top-2 rounded-sm bg-accent px-2 py-0.5 font-mono text-[10px] uppercase tracking-mono text-bg">
            Tonton
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-bg shadow-lg">
              <IconPlay className="h-4 w-4" />
            </div>
          </div>
        </div>

        <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug tracking-tight">{item.title}</p>
        <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-mono text-soft">
          {item.tags.slice(0, 2).join(' · ') || 'Drama'}
        </p>
      </motion.button>
    </>
  );
}
