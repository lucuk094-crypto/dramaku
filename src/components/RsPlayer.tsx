'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProgress, saveProgress } from '@/lib/store';

type Props = {
  bookId: string;
  chapterId: string;
  episode: number;
  episodeCount: number;
  title: string;
  cover?: string;
  active: boolean;
};

/**
 * Player video ReelShort (semua episode terbuka).
 * - Safari/iOS: putar HLS NATIF (tanpa hls.js) — paling stabil, termasuk di iframe.
 * - Browser lain: hls.js (MSE), dengan deteksi kegagalan yang jelas.
 * - Status selalu terlihat: memuat / ketuk-untuk-putar / gagal + tombol perbaikan.
 */
export default function RsPlayer({ bookId, chapterId, episode, episodeCount, title, cover, active }: Props) {
  const vref = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(true);
  const [note, setNote] = useState<string>('');
  const [stamp, setStamp] = useState(0); // untuk retry
  const src = `/api/rs-video/${bookId}/${chapterId}?ep=${episode}`;
  const epLabel = `EPISODE ${episode} DARI ${episodeCount}`;

  /* sumber video: native dulu bila didukung, selain itu hls.js */
  useEffect(() => {
    const v = vref.current;
    if (!v) return;
    let hls: any = null;
    let dead = false;
    setStatus('loading');
    setNote('');

    const nativeHls = v.canPlayType('application/vnd.apple.mpegurl') !== '';
    const mse = typeof window !== 'undefined' && !!((window as any).MediaSource || (window as any).ManagedMediaSource);

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

    if (nativeHls) {
      v.src = src;
      v.load();
    } else if (mse) {
      import('hls.js').then(({ default: Hls }) => {
        if (dead) return;
        if (!Hls.isSupported()) {
          setStatus('error');
          setNote('Browser ini tidak mendukung pemutaran HLS.');
          return;
        }
        hls = new Hls({ maxBufferLength: 30, fragLoadingMaxRetry: 4 });
        hls.on(Hls.Events.ERROR, (_e: unknown, data: any) => {
          if (data?.fatal && !dead) {
            setStatus('error');
            setNote(`Gagal memuat stream (${data?.type || 'error'}).`);
          }
        });
        hls.loadSource(src);
        hls.attachMedia(v);
      }).catch(() => {
        if (!dead) {
          setStatus('error');
          setNote('Modul pemutar gagal dimuat.');
        }
      });
    } else {
      setStatus('error');
      setNote('Browser ini tidak mendukung pemutaran video HLS.');
    }

    return () => {
      dead = true;
      v.removeEventListener('canplay', onCanPlay);
      v.removeEventListener('error', onErr);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      if (hls) {
        try {
          hls.destroy();
        } catch {}
      }
    };
  }, [src, stamp]);

  /* riwayat tontonan + lanjutkan posisi terakhir */
  useEffect(() => {
    const v = vref.current;
    if (!v) return;
    const histSlug = `rs-${bookId}`;
    const histUrl = `/reelshort/tonton/${bookId}?ep=${episode}`;
    let last = 0;
    const save = () => {
      if (!v.duration || !Number.isFinite(v.duration)) return;
      const now = Date.now();
      if (now - last < 5000) return;
      last = now;
      saveProgress({
        slug: histSlug,
        title,
        cover: cover || null,
        episode,
        episode_count: episodeCount,
        position: v.currentTime,
        duration: v.duration,
        url: histUrl,
        src: 'reel',
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
  }, [bookId, episode, episodeCount, title, cover]);

  /* autoplay muted saat slide aktif */
  useEffect(() => {
    const v = vref.current;
    if (!v || !active || status !== 'ready') return;
    v.muted = true;
    setMuted(true);
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => setPaused(true));
  }, [active, status]);

  const toggle = () => {
    const v = vref.current;
    if (!v) return;
    if (v.paused) {
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => setPaused(true));
    } else {
      v.pause();
    }
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
        poster={cover}
        controls
        playsInline
        {...({ 'webkit-playsinline': 'true' } as Record<string, string>)}
        x5-video-player-type="h5"
        x5-video-orientation="portrait"
        preload="auto"
        muted={muted}
        className="absolute inset-0 h-full w-full bg-black object-contain"
      />

      {/* lapisan status */}
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
              <p className="mt-1 text-xs leading-relaxed text-white/60">
                {note} Pratinjau terkadang memblokir pemutar video — buka lewat tab baru pasti jalan.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button onClick={() => setStamp((s) => s + 1)} className="go rounded-full border border-white/25 px-4 py-2 text-xs text-white hover:bg-white/10">
                Coba Lagi
              </button>
              <a
                href={`/reelshort/tonton/${bookId}?ep=${episode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="go rounded-full bg-[--accent] px-4 py-2 text-xs font-semibold text-[--accent-bg]"
              >
                Buka di Tab Baru
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* kanan bawah: suara + label episode */}
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

      {/* kiri atas: judul */}
      <div className="pointer-events-none absolute left-3 top-3 z-20 max-w-[75%]">
        <p className="line-clamp-2 text-sm font-semibold text-white drop-shadow" title={title}>
          {title}
        </p>
      </div>
    </div>
  );
}
