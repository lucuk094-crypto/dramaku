'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getHistory, removeHistory, type HistoryItem } from '@/lib/store';
import { IconPlay, IconX } from './Icons';

/** Baris "Lanjutkan Menonton" dari riwayat lokal — kartu panel + progres mono. */
export default function ContinueRow() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Satu kartu per JUDUL (series), bukan per episode: ambil episode terbaru
  // yang ditonton dari tiap judul, lalu batasi 12 kartu.
  const refresh = () => {
    const seen = new Set<string>();
    const unique: HistoryItem[] = [];
    for (const h of getHistory()) {
      if (seen.has(h.slug)) continue;
      seen.add(h.slug);
      unique.push(h);
      if (unique.length >= 12) break;
    }
    setItems(unique);
  };

  useEffect(() => {
    setMounted(true);
    refresh();
    const onChange = () => refresh();
    window.addEventListener('dramaku:store', onChange);
    window.addEventListener('focus', onChange);
    return () => {
      window.removeEventListener('dramaku:store', onChange);
      window.removeEventListener('focus', onChange);
    };
  }, []);

  if (!mounted || !items.length) return null;

  return (
    <section>
      <div className="head">
        <p className="eyebrow">Lanjutkan</p>
        <h2>Riwayat Tontonanmu</h2>
        <div className="head-side">
          <Link href="/history" className="go focus-ring rounded">
            Semua riwayat
          </Link>
        </div>
      </div>

      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1.5">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const progress = item.duration > 0 ? Math.min(100, (item.position / item.duration) * 100) : 0;
            return (
              <motion.div
                key={item.slug}
                layout
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                className="group relative w-[210px] shrink-0"
              >
                <Link href={item.url || `/watch/${item.slug}/${item.episode}`} className="panel panel-hover focus-ring [display:block] overflow-hidden">
                  <div className="relative aspect-video w-full overflow-hidden border-b border-border/[var(--border-alpha)]">
                    {item.cover ? (
                      <img
                        src={item.cover}
                        alt={item.title || ''}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                      />
                    ) : (
                      <div className="h-full w-full bg-accent-bg" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-900">
                        <IconPlay className="ml-0.5 h-4 w-4" />
                      </span>
                    </div>
                    {/* progres */}
                    <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/25">
                      <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="truncate text-sm font-medium tracking-tight">{item.title || item.slug}</h3>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-mono text-soft">
                      Ep {item.episode}
                      {item.episode_count ? ` / ${item.episode_count}` : ''}
                      {item.duration > 0 ? ` · sisa ${Math.max(0, Math.round((item.duration - item.position) / 60))} mnt` : ''}
                    </p>
                  </div>
                </Link>
                <button
                  aria-label="Hapus dari riwayat"
                  onClick={() => {
                    removeHistory(item.slug);
                    refresh();
                  }}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-sm bg-black/50 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 hover:bg-red-500"
                >
                  <IconX className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
