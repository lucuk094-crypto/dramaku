'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clearHistory, getHistory, removeHistory, type HistoryItem } from '@/lib/store';
import { fmtTime } from '@/lib/format';
import EmptyState from '@/components/EmptyState';
import { PageHeader } from '@/components/MediaRow';
import { IconClock, IconPlay, IconX } from '@/components/Icons';

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const refresh = () => setItems(getHistory());

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
          eyebrow="Log tontonan — tersimpan lokal"
          title="Riwayat Tontonan"
          subtitle="Lanjutkan dari episode dan menit terakhir kamu menonton."
        />
        {mounted && items.length > 0 && (
          <button
            onClick={() => {
              clearHistory();
              refresh();
            }}
            className="btn btn-ghost focus-ring mb-8"
            style={{ borderColor: 'rgb(244 63 94 / 0.4)', color: '#f43f5e' }}
          >
            Hapus semua
          </button>
        )}
      </div>

      {!mounted ? null : items.length === 0 ? (
        <EmptyState
          title="Belum ada riwayat"
          description="Setiap drama yang kamu tonton akan muncul di sini otomatis."
          cta="Mulai menonton"
          href="/"
          icon={<IconClock className="h-7 w-7" />}
        />
      ) : (
        <div className="panel">
          <AnimatePresence initial={false}>
            {items.map((item) => {
              const progress = item.duration > 0 ? Math.min(100, (item.position / item.duration) * 100) : 0;
              return (
                <motion.div
                  key={`${item.slug}-${item.episode}`}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
                  className="panel-row group"
                >
                  <Link href={item.url || `/watch/${item.slug}/${item.episode}`} className="focus-ring relative h-16 w-28 shrink-0 overflow-hidden rounded border border-border/[var(--border-alpha)]">
                    {item.cover ? (
                      <img src={item.cover} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-accent-bg" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
                      <IconPlay className="h-5 w-5 text-white" />
                    </div>
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link href={item.url || `/watch/${item.slug}/${item.episode}`} className="focus-ring [display:block]">
                      <h3 className="truncate text-sm font-medium tracking-tight transition-colors group-hover:text-accent">
                        {item.title || item.slug}
                      </h3>
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-mono text-soft">
                        Ep {item.episode}
                        {item.duration > 0 ? ` · ${fmtTime(item.position)} / ${fmtTime(item.duration)}` : ''}
                      </p>
                    </Link>
                    <div className="mt-2 h-[3px] w-full max-w-md overflow-hidden rounded-sm bg-border">
                      <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <button
                    aria-label="Hapus dari riwayat"
                    onClick={() => {
                      removeHistory(item.slug);
                      refresh();
                    }}
                    className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded text-soft transition hover:bg-red-500/10 hover:text-red-400"
                  >
                    <IconX className="h-4 w-4" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
