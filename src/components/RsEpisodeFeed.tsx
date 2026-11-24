'use client';

import { useEffect, useRef, useState } from 'react';
import RsPlayer from './RsPlayer';

export interface RsFeedEpisode {
  chapterId: string;
  serial: number;
  pic: string;
}

interface Props {
  bookId: string;
  title: string;
  cover: string | null;
  episodeCount: number;
  episodes: RsFeedEpisode[];
  startEp: number;
}

/**
 * Feed episode vertikal ala TikTok untuk ReelShort — geser untuk pindah
 * episode; URL ?ep= ikut terupdate; hanya slide sekitar yang dimount.
 */
export default function RsEpisodeFeed({
  bookId,
  title,
  cover,
  episodeCount,
  episodes,
  startEp,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(startEp);

  /* sinkron saat pindah episode lewat tautan (?ep= berubah) —
     state React tidak ikut reset saat server re-render */
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

  /* gulir langsung ke episode awal (tanpa animasi) */
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

  /* slide terlihat >55% → episode aktif (serasi video & URL) */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let ready = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!ready) return;
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
            const ep = Number((entry.target as HTMLElement).dataset.ep);
            if (ep >= 1 && ep <= episodeCount) setActive(ep);
          }
        }
      },
      { root: el, threshold: [0.55] },
    );
    const slides = el.querySelectorAll('[data-ep]');
    slides.forEach((s) => io.observe(s));
    const t = setTimeout(() => {
      ready = true;
    }, 400);
    return () => {
      clearTimeout(t);
      io.disconnect();
    };
  }, [episodeCount]);

  /* URL ?ep= tanpa reload */
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
        const mounted = Math.abs(ep.serial - active) <= 1;
        return (
          <div
            key={ep.chapterId}
            data-ep={ep.serial}
            className="flex h-full w-full snap-start items-center justify-center p-1"
          >
            {mounted ? (
              <RsPlayer
                bookId={bookId}
                chapterId={ep.chapterId}
                episode={ep.serial}
                episodeCount={episodeCount}
                title={title}
                cover={ep.pic || cover}
                active={ep.serial === active}
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
