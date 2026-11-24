'use client';

import { useEffect, useRef, useState } from 'react';
import DkPlayer from './DkPlayer';

export interface DkFeedEpisode {
  n: number;
  src: string;
  pic: string;
}

interface Props {
  slug: string;
  title: string;
  cover: string;
  episodes: DkFeedEpisode[];
  startEp: number;
}

/**
 * Feed tonton gaya TikTok/Melolo untuk serial Drakorku —
 * geser ke atas = episode berikutnya, semua episode terbuka.
 */
export default function DkEpisodeFeed({ slug, title, cover, episodes, startEp }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(startEp);

  /* sinkron saat pindah episode lewat tautan (?ep= berubah) */
  useEffect(() => {
    setActive(startEp);
    const el = scrollRef.current;
    if (!el) return;
    const target = el.querySelector(`[data-ep="${startEp}"]`) as HTMLElement | null;
    if (target) {
      const prev = el.style.scrollBehavior;
      el.style.scrollBehavior = 'auto';
      el.scrollTop = target.offsetTop;
      requestAnimationFrame(() => {
        el.style.scrollBehavior = prev;
      });
    }
  }, [startEp]);

  /* gulir ke episode awal (tanpa animasi) */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = el.querySelector(`[data-ep="${startEp}"]`) as HTMLElement | null;
    if (target) {
      const prev = el.style.scrollBehavior;
      el.style.scrollBehavior = 'auto';
      el.scrollTop = target.offsetTop;
      requestAnimationFrame(() => {
        el.style.scrollBehavior = prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* pantau slide terlihat >55% → episode aktif */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let ready = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!ready) {
          ready = true;
          return;
        }
        for (const en of entries) {
          if (en.isIntersecting && en.intersectionRatio > 0.55) {
            const n = Number((en.target as HTMLElement).dataset.ep);
            if (n) setActive(n);
          }
        }
      },
      { root: el, threshold: [0.55] },
    );
    el.querySelectorAll('[data-ep]').forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [episodes.length]);

  /* tampilkan nomor episode aktif di URL */
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('ep') !== String(active)) {
      url.searchParams.set('ep', String(active));
      window.history.replaceState(null, '', url.toString());
    }
  }, [active]);

  return (
    <div
      ref={scrollRef}
      className="panel no-scrollbar relative h-[68dvh] min-h-[360px] overflow-y-auto overscroll-contain scroll-smooth snap-y snap-mandatory"
    >
      {episodes.map((ep) => {
        const mounted = Math.abs(ep.n - active) <= 1;
        return (
          <div key={ep.n} data-ep={ep.n} className="flex h-full w-full snap-start items-center justify-center p-1">
            {mounted && ep.src ? (
              <DkPlayer
                src={ep.src}
                poster={ep.pic || cover}
                title={title}
                epLabel={`EPISODE ${ep.n} DARI ${episodes.length}`}
                autoPlay={ep.n === active}
                histSlug={`dk-${slug}`}
                histUrl={`/drakorku/tonton/${slug}?ep=${ep.n}`}
                episode={ep.n}
                episodeCount={episodes.length}
              />
            ) : (
              <div
                className="h-full w-full rounded bg-black bg-cover bg-center"
                style={ep.pic ? { backgroundImage: `url(${ep.pic})` } : undefined}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
