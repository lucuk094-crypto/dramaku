'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { EpisodeInfo } from '@/lib/melolo';
import { getHistory } from '@/lib/store';

/**
 * Grid episode — penomoran LENGKAP 1..N. Episode yang bisa diputar tampil
 * normal; yang stream-nya segera dirilis di sumber tampil redup dengan
 * badge jelas "BELUM RILIS" di setiap kotaknya (bukan terkunci/premium) sehingga langsung
 * dipahami sekilas, dan tetap
 * mengarah ke halaman tonton yang memberi keterangan + tombol lompat.
 */
export default function EpisodeGrid({ slug, episodes }: { slug: string; episodes: EpisodeInfo[] }) {
  const [watched, setWatched] = useState<Set<number>>(new Set());
  const [current, setCurrent] = useState<number | null>(null);

  const playableCount = episodes.filter((ep) => ep.playable !== false).length;

  useEffect(() => {
    const history = getHistory().filter((h) => h.slug === slug);
    setWatched(new Set(history.filter((h) => h.position > (h.duration || 1) * 0.9).map((h) => h.episode)));
    const latest = history.sort((a, b) => b.updated_at - a.updated_at)[0];
    setCurrent(latest?.episode ?? null);
  }, [slug]);

  return (
    <div>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
        {episodes.map((ep, i) => {
          const isWatched = watched.has(ep.episode_id);
          const isCurrent = current === ep.episode_id;
          const playable = ep.playable !== false;
          return (
            <motion.div
              key={ep.episode_id}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.015, 0.4), ease: [0.23, 1, 0.32, 1] }}
            >
              <Link
                href={`/watch/${slug}/${ep.episode_id}`}
                title={playable ? `Episode ${ep.episode_id}` : `Episode ${ep.episode_id} — belum rilis di sumber`}
                className={`focus-ring relative flex aspect-square items-center justify-center rounded border font-mono text-xs tracking-mono transition hover:scale-[1.06] ${
                  isCurrent
                    ? 'border-accent bg-accent text-[rgb(var(--btn-text))] hover:border-accent/60'
                    : isWatched && playable
                      ? 'border-accent/30 bg-accent-bg text-accent hover:border-accent/60'
                      : playable
                        ? 'border-border/[var(--border-alpha)] bg-card text-fg/85 hover:border-accent/60'
                        : 'border-dashed border-border/[var(--border-alpha)] bg-card/40 text-soft/70 hover:border-soft/40'
                }`}
              >
                {playable ? (
                  <>
                    {ep.episode_id}
                    {isWatched && !isCurrent && (
                      <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent" />
                    )}
                  </>
                ) : (
                  <span className="flex flex-col items-center gap-[3px]">
                    <span>{ep.episode_id}</span>
                    <span className="rounded-full border border-soft/50 bg-soft/10 px-[2px] py-[1px] text-[6.5px] leading-none tracking-[0.03em] text-muted sm:px-[3px] sm:text-[8px]">BELUM RILIS</span>
                  </span>
                )}
              </Link>
            </motion.div>
          );
        })}
      </div>
      {episodes.length > playableCount && (
        <p className="mt-3 font-mono text-[11px] uppercase tracking-mono text-soft">
          {playableCount} dari {episodes.length} episode siap ditonton · sisanya belum rilis di sumber
        </p>
      )}
    </div>
  );
}
