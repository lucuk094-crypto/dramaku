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
 * Feed episode vertikal ala TikTok/melolo: geser (scroll) untuk pindah episode.
 * URL ikut terupdate tanpa reload; hanya episode di sekitar slide aktif yang
 * dimount agar ringan, dan video non-aktif dijeda otomatis.
 */
export default function EpisodeFeed({ seriesSlug, title, cover, episodeCount, availableCount, startEp }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(startEp);
  const [visited, setVisited] = useState<Set<number>>(() => new Set([startEp]));

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

  /* gulir langsung ke episode awal (sekali saat mount, TANPA animasi agar
     tidak ada slide lain yang sempat terlihat → video lain ikut termount) */
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

  /* pantau slide yang terlihat >55% → jadikan episode aktif.
     Abaikan callback pertama dari IntersectionObserver (masih menunjuk
     posisi awal) supaya nomor episode & video yang diputar selalu serasi. */
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
    el.querySelectorAll('[data-ep]').forEach((node) => io.observe(node));
    const raf = requestAnimationFrame(() => {
      ready = true;
    });
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
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

  const goTo = (ep: number) => {
    const el = scrollRef.current;
    const target = el?.querySelector(`[data-ep="${ep}"]`) as HTMLElement | null;
    if (el && target) el.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
  };

  const episodes = Array.from({ length: episodeCount }, (_, i) => i + 1);

  return (
    <section aria-label="Feed episode" className="mb-10">
      {/* readout instrumen */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="eyebrow">
          Mode geser — Episode {String(active).padStart(2, '0')} / {String(episodeCount).padStart(2, '0')}
        </p>
        <p className="mono text-soft">
          Geser ke atas <IconChevronLeft className="inline h-3.5 w-3.5 rotate-90 align-[-2px]" /> untuk episode
          berikutnya
        </p>
      </div>

      <div
        ref={scrollRef}
        className="panel relative h-[68dvh] min-h-[360px] overflow-y-auto overscroll-contain scroll-smooth snap-y snap-mandatory"
        style={{ scrollbarWidth: 'thin' }}
      >
        {episodes.map((ep) => {
          const mounted = visited.has(ep);
          return (
            <div
              key={ep}
              data-ep={ep}
              className="flex h-full w-full snap-start flex-col items-center justify-center gap-3 px-3 py-3"
            >
              <div className="flex w-full max-w-4xl items-center justify-between gap-3">
                <p className="mono text-soft">
                  EP <b className="mono-accent font-normal">{String(ep).padStart(2, '0')}</b>
                  {title ? ` — ${title}` : ''}
                </p>
                <p className="mono text-soft">{ep < episodeCount ? '↑ berikutnya' : '↑ akhir'}</p>
              </div>

              <div className="w-full max-w-4xl">
                {ep > availableCount ? (
                  /* episode belum tersedia di sumber — placeholder jelas, bukan error */
                  <div className="panel flex aspect-video w-full flex-col items-center justify-center gap-4 px-6 text-center">
                    <p className="eyebrow">Info</p>
                    <p className="text-lg font-medium tracking-tight">
                      Episode {ep} belum tersedia untuk diputar
                    </p>
                    <p className="max-w-md text-sm leading-relaxed text-muted">
                      {title ? `${title} — ` : ''}episode 1–{availableCount} sudah bisa ditonton.
                      Episode lainnya belum tersedia di sumber.
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
                  <Player
                    seriesSlug={seriesSlug}
                    episode={ep}
                    episodeCount={episodeCount}
                    title={title}
                    cover={cover}
                    isActive={ep === active}
                  />
                ) : (
                  <div className="panel flex aspect-video w-full items-center justify-center">
                    <p className="mono text-soft">Memuat episode {ep}…</p>
                  </div>
                )}
              </div>

              <div className="flex w-full max-w-4xl items-center justify-between gap-3">
                <p className="mono text-soft">
                  Status <b className="mono-accent font-normal">{ep > availableCount ? 'Belum tersedia' : ep === active ? 'Diputar' : 'Siaga'}</b>
                </p>
                <div className="flex items-center gap-2">
                  {ep > 1 && (
                    <button type="button" onClick={() => goTo(ep - 1)} className="btn btn-ghost btn-sm focus-ring">
                      <IconChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
                    </button>
                  )}
                  {ep < episodeCount && (
                    <button type="button" onClick={() => goTo(ep + 1)} className="btn btn-main btn-sm focus-ring">
                      Berikutnya <IconChevronLeft className="h-3.5 w-3.5 rotate-180" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* petunjuk + lompat episode */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="mono text-soft">
          Tip — klik video untuk putar/jeda · geser untuk pindah episode seperti TikTok
        </p>
        <Link href={`/series/${seriesSlug}`} className="go focus-ring rounded">
          <IconPlay className="h-3.5 w-3.5" /> Detail seri
        </Link>
      </div>
    </section>
  );
}
