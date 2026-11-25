'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFavorites, removeFavorite, type FavItem } from '@/lib/store';
import EmptyState from '@/components/EmptyState';
import { PageHeader } from '@/components/MediaRow';
import { IconHeartFilled, IconPlay, IconX } from '@/components/Icons';

/** Tautan favorit sadar jenis — novel/dramabox tidak boleh diarahkan ke /series/. */
function favHref(item: FavItem): string {
  if (item.type === 'novels') return `/novels/${item.slug}`;
  if (item.type === 'dramabox') return `/dramabox/judul/${item.slug.replace(/^db-/, '')}`;
  if (item.type === 'series') return `/series/${item.slug}`;
  if (item.slug.startsWith('db-')) return `/dramabox/judul/${item.slug.slice(3)}`;
  return `/buka/${item.slug}`; // data lama tanpa jenis — deteksi otomatis di server
}

export default function FavoritesPage() {
  const [items, setItems] = useState<FavItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const refresh = () => setItems(getFavorites());

  useEffect(() => {
    setMounted(true);
    refresh();
    window.addEventListener('dramaku:store', refresh);
    return () => window.removeEventListener('dramaku:store', refresh);
  }, []);

  return (
    <div className="container-x pb-16 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow="Koleksi pribadi — tersimpan lokal"
          title="Favorit"
          subtitle="Drama yang kamu simpan, siap ditonton kapan saja."
        />
        {mounted && items.length > 0 && (
          <p className="mb-8 mono text-soft">
            Total <b className="mono-accent font-normal">{items.length}</b> judul
          </p>
        )}
      </div>

      {!mounted ? null : items.length === 0 ? (
        <EmptyState
          title="Belum ada favorit"
          description="Tekan tombol hati di halaman drama untuk menyimpannya ke sini."
          cta="Cari drama"
          href="/search"
          icon={<IconHeartFilled className="h-7 w-7" />}
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          <AnimatePresence initial={false}>
            {items.map((item, i) => (
              <motion.div
                key={item.slug}
                layout
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.35), ease: [0.23, 1, 0.32, 1] }}
                className="group relative"
              >
                <Link href={favHref(item)} className="media-card focus-ring rounded">
                  <div className="media-poster">
                    {item.cover ? (
                      <img src={item.cover} alt={item.title || ''} loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-accent-bg">
                        <span className="text-3xl font-black text-accent/50">{(item.title || '?')[0]}</span>
                      </div>
                    )}
                    <div className="veil" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-900">
                        <IconPlay className="ml-0.5 h-4 w-4" />
                      </span>
                    </div>
                    {item.rating && (
                      <div className="absolute right-2 top-2 rounded-sm bg-black/55 px-2 py-0.5 font-mono text-[11px] text-amber-300">
                        ★ {item.rating}
                      </div>
                    )}
                  </div>
                  <h3 className="media-title">{item.title || item.slug}</h3>
                  <p className="media-meta">
                    {item.episode_count !== null
                      ? item.type === 'novels'
                        ? `${item.episode_count} bab`
                        : `${item.episode_count} Episode`
                      : item.type === 'novels'
                        ? 'Novel'
                        : 'Drama'}
                  </p>
                </Link>
                <button
                  aria-label="Hapus favorit"
                  onClick={() => {
                    removeFavorite(item.slug);
                    refresh();
                  }}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-sm bg-black/50 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 hover:bg-red-500"
                >
                  <IconX className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
