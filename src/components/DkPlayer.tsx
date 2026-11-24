'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProgress, saveProgress } from '@/lib/store';

type Props = {
  src: string; // URL proxy MP4
  poster?: string;
  title: string;
  epLabel: string;
  autoPlay?: boolean;
  /** identitas riwayat tontonan */
  histSlug: string;
  histUrl: string;
  episode: number;
  episodeCount: number;
};

/**
 * Player video MP4 Drakorku — putar langsung (native), status jelas,
 * autoplay senyap saat slide aktif, tombol suara + label episode.
 */
export default function DkPlayer({ src, poster, title, epLabel, autoPlay = true, histSlug, histUrl, episode, episodeCount }: Props) {
  const vref = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(true);
  const [note, setNote] = useState('');
  const [stamp, setStamp] = useState(0);

  useEffect(() => {
    const v = vref.current;
    if (!v) return;
    let dead = false;
    setStatus('loading');
    setNote('');
    const onCanPlay = () => !dead && setStatus('ready');
    const onErr = () => {
      if (!dead && v.error) {
        setStatus('error');
        setNote(`Kesalahan video (kode ${v.error.code}).`);
      }
    };
    const onPlay = () => !dead && setPaused(false);
    const onPause = () => !dead && setPaused(true);
    v.addEventListener('canplay', onCanPlay);
    v.addEventListener('error', onErr);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.src = src;
    v.load();
    return () => {
      dead = true;
      v.removeEventListener('canplay', onCanPlay);
      v.removeEventListener('error', onErr);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, [src, stamp]);

  /* riwayat tontonan + lanjutkan posisi terakhir */
  useEffect(() => {
    const v = vref.current;
    if (!v) return;
    let last = 0;
    const save = () => {
      if (!v.duration || !Number.isFinite(v.duration)) return;
      const now = Date.now();
      if (now - last < 5000) return;
      last = now;
      saveProgress({
        slug: histSlug,
        title,
        cover: poster || null,
        episode,
        episode_count: episodeCount,
        position: v.currentTime,
        duration: v.duration,
        url: histUrl,
        src: 'asia',
      });
    };
    const resume = () => {
      const prog = getProgress(histSlug);
      if (
        prog &&
        prog.episode === episode &&
        prog.position > 5 &&
        prog.duration > 0 &&
        prog.position < prog.duration * 0.95 &&
        v.currentTime < 2
      ) {
        v.currentTime = prog.position;
      }
    };
    v.addEventListener('timeupdate', save);
    v.addEventListener('pause', save);
    v.addEventListener('loadedmetadata', resume);
    return () => {
      v.removeEventListener('timeupdate', save);
      v.removeEventListener('pause', save);
      v.removeEventListener('loadedmetadata', resume);
    };
  }, [histSlug, histUrl, episode, episodeCount, title, poster]);

  useEffect(() => {
    const v = vref.current;
    if (!v || !autoPlay || status !== 'ready') return;
    v.muted = true;
    setMuted(true);
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => setPaused(true));
  }, [autoPlay, status]);

  const toggle = () => {
    const v = vref.current;
    if (!v) return;
    if (v.paused) {
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => setPaused(true));
    } else v.pause();
  };

  const toggleMute = () => {
    const v = vref.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (v.paused) {
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded bg-black">
      <video
        ref={vref}
        poster={poster}
        controls
        playsInline
        preload="auto"
        muted={muted}
        className="absolute inset-0 h-full w-full bg-black object-contain"
      />

      <AnimatePresence>
        {status === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/45"
          >
            <div className="flex flex-col items-center gap-3">
              <span className="h-9 w-9 animate-spin rounded-full border-2 border-white/25 border-t-white" />
              <p className="mono text-[11px] tracking-wider text-white/85">MEMUAT VIDEO…</p>
            </div>
          </motion.div>
        )}

        {status === 'ready' && paused && (
          <motion.button
            key="play"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggle}
            aria-label="Putar"
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-gradient-to-t from-black/70 via-black/15 to-black/35"
          >
            <span className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-white/25 bg-black/55 backdrop-blur-md">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="ml-1 text-white">
                <path d="M8 5.14v13.72a1 1 0 0 0 1.53.85l10.79-6.86a1 1 0 0 0 0-1.7L9.53 4.29A1 1 0 0 0 8 5.14Z" />
              </svg>
            </span>
            <span className="mono rounded-full bg-black/55 px-3 py-1 text-[10px] tracking-wider text-white/85">
              KETUK UNTUK MEMUTAR
            </span>
          </motion.button>
        )}

        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/85 p-6 text-center"
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-300">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
            <div>
              <p className="text-sm font-medium text-white">Video gagal diputar di tampilan ini</p>
              <p className="mt-1 text-xs leading-relaxed text-white/60">{note} Coba lagi atau buka lewat tab baru.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button onClick={() => setStamp((s) => s + 1)} className="go rounded-full border border-white/25 px-4 py-2 text-xs text-white hover:bg-white/10">
                Coba Lagi
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
        <button
          onClick={toggleMute}
          aria-label={muted ? 'Nyalakan suara' : 'Bisukan'}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-md transition hover:bg-black/75"
        >
          {muted ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M11 5 6 9H3v6h3l5 4V5Z" />
              <path d="m22 9-6 6m0-6 6 6" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M11 5 6 9H3v6h3l5 4V5Z" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
            </svg>
          )}
        </button>
        <span className="mono rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-[10px] tracking-wider text-white/85 backdrop-blur-md">
          {epLabel}
        </span>
      </div>

      <div className="pointer-events-none absolute left-3 top-3 z-20 max-w-[75%]">
        <p className="line-clamp-2 text-sm font-semibold text-white drop-shadow" title={title}>
          {title}
        </p>
      </div>
    </div>
  );
}
