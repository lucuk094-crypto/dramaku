'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Player from './Player';
import { IconChevronLeft, IconPlay } from './Icons';

interface Props {
  seriesSlug: string;
  title: string | null;
  cover: string | null;
  /** TOTAL episode (penomoran lengkap 1..N). */
  episodeCount: number;
  /** Episode yang stream-nya tersedia & bisa diputar. */
  availableCount: number;
  startEp: number;
}

/**
 * Pemutar episode full-screen ala TikTok/melolo:
 * - layar penuh mode potret (video memenuhi viewport, hitam di sekitarnya);
 * - geser/scroll = snap antar episode;
 * - UI melayang (kembali, EP xx/NN, detail, geser);
 * - video selalu serasi dengan nomor episode yang aktif.
 * Desktop: kolom snap besar di tengah halaman.
 */
export default function EpisodeFeed({ seriesSlug, title, cover, episodeCount, availableCount, startEp }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(startEp);
  const [visited, setVisited] = useState<Set<number>>(() => new Set([startEp]));

  /* kunci scroll latar saat layar-penuh (mobile) — pakai kelas !important
     supaya tidak tertimpa komponen lain yang menyetel body.style */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    if (!mq.matches) return;
    const style = document.createElement('style');
    style.textContent = 'body.dk-feed-locked{overflow:hidden !important;}';
    document.head.appendChild(style);
    document.body.classList.add('dk-feed-locked');
    return () => {
      document.body.classList.remove('dk-feed-locked');
      style.remove();
    };
  }, []);

  /* sinkron saat pindah episode lewat tautan — state tidak ikut reset
     saat server re-render dengan ?/episode baru */
  useEffect(() => {
    setActive(startEp);
    setVisited((v) => new Set(v).add(startEp));
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

  /* gulir langsung ke episode awal — ulangi sampai benar-benar mendarat
     (CSS/layout bisa telat stabil, snap-mandatory menuntut posisi mantap) */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let tries = 0;
    let ok = 0;
    let raf = 0;
    const jump = () => {
      const target = el.querySelector(`[data-ep="${startEp}"]`) as HTMLElement | null;
      if (target && target.offsetHeight > 0) {
        const prev = el.style.scrollBehavior;
        el.style.scrollBehavior = 'auto';
        const top = target.offsetTop;
        if (Math.abs(el.scrollTop - top) > 2) {
          el.scrollTop = top;
          ok = 0;
        } else {
          ok += 1;
        }
        el.style.scrollBehavior = prev;
      }
      if (ok < 3 && ++tries < 180) raf = requestAnimationFrame(jump);
    };
    raf = requestAnimationFrame(jump);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* pantau slide aktif dari posisi scroll (deterministik untuk snap container) */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = el.clientHeight || 1;
        const idx = Math.min(episodeCount, Math.max(1, Math.round(el.scrollTop / h) + 1));
        setActive((cur) => (cur === idx ? cur : idx));
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('scroll', onScroll);
    };
  }, [episodeCount]);

  /* episode yang sudah pernah dikunjungi tetap mounted (±1 dari aktif) */
  useEffect(() => {
    setVisited((prev) => {
      const next = new Set(prev);
      const before = next.size;
      [active - 1, active, active + 1].forEach((ep) => {
        if (ep >= 1 && ep <= episodeCount) next.add(ep);
      });
      return next.size === before ? prev : next;
    });
  }, [active, episodeCount]);

  /* sinkronkan URL tanpa navigasi/refetch + kabari komponen lain (meta bar) */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = `/watch/${seriesSlug}/${active}`;
    if (!window.location.pathname.endsWith(`/${seriesSlug}/${active}`)) {
      window.history.replaceState(null, '', url);
    }
    window.dispatchEvent(new CustomEvent('dramaku:episode', { detail: { slug: seriesSlug, episode: active } }));
  }, [active, seriesSlug]);

  /* autoplay mulus ala TikTok: coba putar; bila diblokir browser → bisukan lalu putar */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const slide = el.querySelector(`[data-ep="${active}"] video`) as HTMLVideoElement | null;
    if (!slide) return;
    slide.play().catch(() => {
      try {
        slide.muted = true;
      } catch {
        /* noop */
      }
      slide.play().catch(() => {});
    });
  }, [active, visited]);

  const goTo = (ep: number) => {
    const el = scrollRef.current;
    const target = el?.querySelector(`[data-ep="${ep}"]`) as HTMLElement | null;
    if (el && target) el.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
  };

  const episodes = Array.from({ length: episodeCount }, (_, i) => i + 1);

  return (
    <section
      aria-label="Pemutar episode"
      className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[rgb(var(--bg))] md:static md:z-auto md:mx-auto md:mt-8 md:h-[84dvh] md:max-w-5xl md:rounded-lg"
    >
      {/* bilah melayang atas */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 bg-gradient-to-b from-black/75 via-black/25 to-transparent px-3 pb-12 pt-[calc(env(safe-area-inset-top,0px)+0.65rem)] md:px-4">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) window.history.back();
            else window.location.href = `/series/${seriesSlug}`;
          }}
          className="focus-ring pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md transition hover:bg-black/70"
        >
          <IconChevronLeft className="h-3.5 w-3.5" /> Kembali
        </button>
        <p className="rounded-full border border-white/15 bg-black/45 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/85 backdrop-blur-md">
          EP {String(active).padStart(2, '0')} / {String(episodeCount).padStart(2, '0')} · geser ↑↓
        </p>
        <Link
          href={`/series/${seriesSlug}`}
          className="focus-ring pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md transition hover:bg-black/70"
        >
          <IconPlay className="h-3 w-3" /> Detail
        </Link>
      </div>

      {/* feed snap per episode */}
      <div
        ref={scrollRef}
        className="relative flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain"
        style={{ scrollbarWidth: 'none' }}
      >
        {episodes.map((ep) => {
          const mounted = visited.has(ep);
          return (
            <div key={ep} data-ep={ep} className="relative h-full w-full snap-start snap-always">
              {ep > availableCount ? (
                /* episode belum tersedia — panel info full-screen */
                <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-[rgb(var(--bg))] px-6 text-center">
                  <p className="eyebrow">Info</p>
                  <h2 className="text-2xl font-medium tracking-tightest">Episode {ep} belum tersedia</h2>
                  <p className="max-w-md text-sm leading-relaxed text-muted">
                    {title ? `${title} — ` : ''}episode 1–{availableCount} sudah bisa ditonton. Episode
                    lainnya belum tersedia di sumber.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button type="button" onClick={() => goTo(availableCount)} className="btn btn-main btn-sm focus-ring">
                      Lompat ke Episode {availableCount}
                    </button>
                    <button type="button" onClick={() => goTo(1)} className="btn btn-ghost btn-sm focus-ring">
                      Mulai dari Episode 1
                    </button>
                  </div>
                </div>
              ) : mounted ? (
                <div className="absolute inset-0 [&>div]:aspect-auto [&>div]:h-full [&>div]:w-full [&>div]:rounded-none [&>div]:border-0">
                  <Player
                    seriesSlug={seriesSlug}
                    episode={ep}
                    episodeCount={episodeCount}
                    title={title}
                    cover={cover}
                    isActive={ep === active}
                  />
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[rgb(var(--bg))]">
                  <p className="mono text-soft">Memuat episode {ep}…</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* kendali geser melayang */}
      <div className="pointer-events-none absolute inset-y-0 right-2.5 z-30 flex flex-col items-center justify-center gap-2.5 md:right-3.5">
        <button
          type="button"
          aria-label="Episode sebelumnya"
          onClick={() => goTo(active - 1)}
          disabled={active <= 1}
          className="focus-ring pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/90 backdrop-blur-md transition hover:bg-black/70 disabled:opacity-30"
        >
          <IconChevronLeft className="h-4 w-4 rotate-90" />
        </button>
        <button
          type="button"
          aria-label="Episode berikutnya"
          onClick={() => goTo(active + 1)}
          disabled={active >= episodeCount}
          className="focus-ring pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/90 backdrop-blur-md transition hover:bg-black/70 disabled:opacity-30"
        >
          <IconChevronLeft className="h-4 w-4 -rotate-90" />
        </button>
      </div>
    </section>
  );
}
