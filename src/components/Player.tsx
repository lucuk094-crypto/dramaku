'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getProgress, saveProgress } from '@/lib/store';
import { fmtTime } from '@/lib/format';
import {
  IconChevronLeft,
  IconFullscreen,
  IconMute,
  IconPause,
  IconPlay,
  IconSkipNext,
  IconSkipPrev,
  IconVolume,
  IconX,
} from './Icons';

interface Props {
  seriesSlug: string;
  episode: number;
  episodeCount: number;
  title: string | null;
  cover: string | null;
  /** Untuk mode feed geser: hanya slide aktif yang diputar. */
  isActive?: boolean;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const HIDE_MS = 2800;

export default function Player({ seriesSlug, episode, episodeCount, title, cover, isActive = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimer = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  const [nextCountdown, setNextCountdown] = useState<number | null>(null);
  const [autoNext, setAutoNext] = useState(true);
  const [seekFlash, setSeekFlash] = useState<'back' | 'fwd' | null>(null);
  const [fullScreen, setFullScreen] = useState(false);

  const src = `/api/video/${seriesSlug}/${episode}`;
  const hasPrev = episode > 1;
  const hasNext = episode < episodeCount;

  /* ---------------------------------------------------------- controls UI */

  const pokeControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setControlsVisible(false);
      setSpeedOpen(false);
    }, HIDE_MS);
  }, []);

  useEffect(() => () => void (hideTimer.current && clearTimeout(hideTimer.current)), []);

  /* sinkron feed: pause saat tidak aktif, coba putar saat menjadi aktif */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      if (resumeAt !== null && video.currentTime < 1) {
        video.currentTime = resumeAt;
        setResumeAt(null);
      }
      video.play().catch(() => {});
    } else {
      video.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  /* --------------------------------------------------------------- events */

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTime = () => {
      setCurrent(video.currentTime || 0);
      // simpan progres tiap 5 detik
      const now = Date.now();
      if (now - saveTimer.current > 5000 && video.currentTime > 2) {
        saveTimer.current = now;
        saveProgress({
          slug: seriesSlug,
          title,
          cover,
          episode,
          episode_count: episodeCount,
          position: video.currentTime,
          duration: video.duration || 0,
        });
      }
    };
    const onDuration = () => setDuration(video.duration || 0);
    const onProgress = () => {
      try {
        if (video.buffered.length) setBuffered(video.buffered.end(video.buffered.length - 1));
      } catch {
        /* abaikan */
      }
    };
    const onPlay = () => {
      setPlaying(true);
      pokeControls();
    };
    const onPause = () => {
      setPlaying(false);
      setControlsVisible(true);
      if (video.currentTime > 2) {
        saveProgress({
          slug: seriesSlug,
          title,
          cover,
          episode,
          episode_count: episodeCount,
          position: video.currentTime,
          duration: video.duration || 0,
        });
      }
    };
    const onWaiting = () => setLoading(true);
    const onPlaying = () => {
      setLoading(false);
      setError(null);
    };
    const onCanPlay = () => setLoading(false);
    const onEnded = () => {
      setPlaying(false);
      setControlsVisible(true);
      if (hasNext && autoNext) setNextCountdown(5);
    };
    const onError = () => {
      setError('Video gagal dimuat. Periksa koneksi lalu coba lagi.');
      setLoading(false);
    };

    video.addEventListener('timeupdate', onTime);
    video.addEventListener('durationchange', onDuration);
    video.addEventListener('loadedmetadata', onDuration);
    video.addEventListener('progress', onProgress);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('durationchange', onDuration);
      video.removeEventListener('loadedmetadata', onDuration);
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
    };
  }, [seriesSlug, episode, episodeCount, title, cover, hasNext, autoNext, pokeControls]);

  /* resume posisi dari riwayat */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const saved = getProgress(seriesSlug);
    if (saved && saved.episode === episode && saved.position > 5 && saved.position < (saved.duration || Infinity) - 10) {
      setResumeAt(saved.position);
    } else {
      setResumeAt(null);
    }
  }, [seriesSlug, episode]);

  /* countdown auto-next */
  useEffect(() => {
    if (nextCountdown === null) return;
    if (nextCountdown <= 0) {
      window.location.href = `/watch/${seriesSlug}/${episode + 1}`;
      return;
    }
    const t = setTimeout(() => setNextCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [nextCountdown, seriesSlug, episode]);

  /* keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          video.paused ? video.play().catch(() => {}) : video.pause();
          break;
        case 'arrowright':
          e.preventDefault();
          video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
          flash('fwd');
          pokeControls();
          break;
        case 'arrowleft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          flash('back');
          pokeControls();
          break;
        case 'arrowup':
          e.preventDefault();
          setVolumeSafe(Math.min(1, video.volume + 0.1), video);
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolumeSafe(Math.max(0, video.volume - 0.1), video);
          break;
        case 'm':
          video.muted = !video.muted;
          setMuted(video.muted);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'n':
          if (hasNext) window.location.href = `/watch/${seriesSlug}/${episode + 1}`;
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasNext, seriesSlug, episode, pokeControls]);

  /* fullscreen change tracking */
  useEffect(() => {
    const onChange = () => setFullScreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  /* -------------------------------------------------------------- actions */

  const setVolumeSafe = (v: number, video?: HTMLVideoElement | null) => {
    const el = video || videoRef.current;
    if (!el) return;
    el.volume = v;
    el.muted = v === 0;
    setVolume(v);
    setMuted(v === 0);
  };

  const flash = (dir: 'back' | 'fwd') => {
    setSeekFlash(dir);
    setTimeout(() => setSeekFlash(null), 450);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      if (resumeAt !== null && video.currentTime < 1) {
        video.currentTime = resumeAt;
        setResumeAt(null);
      }
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen().catch(() => {});
  };

  const onSeek = (value: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value;
    setCurrent(value);
  };

  const seekByPointer = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
    pokeControls();
  };

  /** Double-tap zona kiri/kanan (mobile). */
  const lastTap = useRef(0);
  const onTapZone = (dir: 'back' | 'fwd') => {
    const now = Date.now();
    const video = videoRef.current;
    if (now - lastTap.current < 320 && video) {
      video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + (dir === 'fwd' ? 10 : -10)));
      flash(dir);
    } else {
      pokeControls();
    }
    lastTap.current = now;
  };

  const percent = duration ? (current / duration) * 100 : 0;
  const bufferedPercent = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full select-none overflow-hidden rounded-md border border-border/[var(--border-alpha)] bg-black"
      onMouseMove={pokeControls}
      onMouseLeave={() => playing && setControlsVisible(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={cover || undefined}
        playsInline
        preload="metadata"
        onClick={togglePlay}
        className="h-full w-full bg-black"
      />

      {/* zona double-tap */}
      <div className="absolute inset-y-0 left-0 w-1/3" onDoubleClick={() => onTapZone('back')} onClick={() => onTapZone('back')} />
      <div className="absolute inset-y-0 right-0 w-1/3" onDoubleClick={() => onTapZone('fwd')} onClick={() => onTapZone('fwd')} />

      {/* flash seek */}
      <AnimatePresence>
        {seekFlash && (
          <motion.div
            key={seekFlash}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`pointer-events-none absolute top-1/2 flex h-20 w-20 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm ${
              seekFlash === 'back' ? 'left-[16%]' : 'right-[16%]'
            }`}
          >
            <span className="text-sm font-semibold">{seekFlash === 'back' ? '−10 dtk' : '+10 dtk'}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* spinner loading */}
      <AnimatePresence>
        {loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <span className="h-12 w-12 rounded-full border-[3px] border-white/20 border-t-accent animate-spinSlow" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* error */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-6 text-center">
          <p className="text-sm text-white/85">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              videoRef.current?.load();
            }}
            className="focus-ring rounded-md bg-accent px-5 py-2 text-sm font-semibold text-white"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* tombol play besar */}
      <AnimatePresence>
        {!playing && !loading && !error && (
          <motion.button
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={togglePlay}
            aria-label="Putar"
            className="absolute inset-0 m-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-glow transition hover:scale-105"
          >
            <IconPlay className="ml-1 h-8 w-8" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* overlay auto-next */}
      <AnimatePresence>
        {nextCountdown !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-x-0 bottom-24 mx-auto flex w-[90%] max-w-md items-center gap-4 rounded-md bg-black/80 p-4 backdrop-blur-md"
          >
            <div className="relative h-11 w-11">
              <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90">
                <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                <motion.circle
                  cx="22" cy="22" r="19" fill="none" stroke="#7C6CF6" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={119.4}
                  animate={{ strokeDashoffset: 119.4 * (1 - (nextCountdown ?? 0) / 5) }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                {nextCountdown}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Episode berikutnya segera dimulai</p>
              <p className="text-xs text-white/60">Episode {episode + 1}</p>
            </div>
            <button
              onClick={() => setNextCountdown(null)}
              className="focus-ring rounded-md border border-white/20 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              Batal
            </button>
            <Link
              href={`/watch/${seriesSlug}/${episode + 1}`}
              className="focus-ring rounded-md bg-accent px-4 py-1.5 text-xs font-semibold text-white"
            >
              Tonton
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* chip resume */}
      <AnimatePresence>
        {resumeAt !== null && !playing && !loading && (
          <motion.button
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            onClick={() => {
              const video = videoRef.current;
              if (video) {
                video.currentTime = resumeAt;
                video.play().catch(() => {});
              }
              setResumeAt(null);
            }}
            className="absolute bottom-24 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
          >
            <IconPlay className="h-4 w-4" /> Lanjutkan dari {fmtTime(resumeAt)}
          </motion.button>
        )}
      </AnimatePresence>

      {/* kontrol bawah */}
      <motion.div
        animate={{ opacity: controlsVisible ? 1 : 0, y: controlsVisible ? 0 : 12 }}
        transition={{ duration: 0.25 }}
        className="pointer-events-none absolute inset-x-0 bottom-0"
      >
        <div className={`bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-3 pt-12 md:px-5 md:pb-4 ${controlsVisible ? 'pointer-events-auto' : ''}`}>
          {/* judul atas */}
          <div className="mb-2 flex items-center gap-3">
            <p className="line-clamp-1 text-sm font-semibold text-white">
              {title || seriesSlug} <span className="text-white/55">· Episode {episode}</span>
            </p>
          </div>

          {/* seek bar */}
          <div
            className="group/seek relative h-2 cursor-pointer rounded-full bg-white/20"
            onClick={seekByPointer}
            role="slider"
            aria-label="Posisi pemutaran"
            aria-valuenow={Math.round(percent)}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
          >
            <div className="absolute inset-y-0 left-0 rounded-full bg-white/30" style={{ width: `${bufferedPercent}%` }} />
            <div className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${percent}%` }} />
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white shadow opacity-0 transition-opacity group-hover/seek:opacity-100"
              style={{ left: `calc(${percent}% - 7px)` }}
            />
          </div>

          {/* baris tombol */}
          <div className="mt-2.5 flex items-center gap-1.5 text-white md:gap-2">
            <button onClick={togglePlay} aria-label={playing ? 'Jeda' : 'Putar'} className="focus-ring rounded-md p-2 transition hover:bg-white/10">
              {playing ? <IconPause className="h-5 w-5" /> : <IconPlay className="h-5 w-5" />}
            </button>

            {hasPrev && (
              <Link href={`/watch/${seriesSlug}/${episode - 1}`} aria-label="Episode sebelumnya" className="focus-ring rounded-md p-2 transition hover:bg-white/10">
                <IconSkipPrev className="h-5 w-5" />
              </Link>
            )}
            {hasNext && (
              <Link href={`/watch/${seriesSlug}/${episode + 1}`} aria-label="Episode berikutnya" className="focus-ring rounded-md p-2 transition hover:bg-white/10">
                <IconSkipNext className="h-5 w-5" />
              </Link>
            )}

            {/* volume */}
            <div className="group/vol flex items-center">
              <button
                onClick={() => setVolumeSafe(muted || volume === 0 ? 1 : 0)}
                aria-label="Suara"
                className="focus-ring rounded-md p-2 transition hover:bg-white/10"
              >
                {muted || volume === 0 ? <IconMute className="h-5 w-5" /> : <IconVolume className="h-5 w-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => setVolumeSafe(Number(e.target.value))}
                className="dk-range w-0 opacity-0 transition-all duration-300 group-hover/vol:w-20 group-hover/vol:opacity-100"
                aria-label="Volume"
              />
            </div>

            <span className="ml-1 text-xs tabular-nums text-white/85">
              {fmtTime(current)} <span className="text-white/45">/ {fmtTime(duration)}</span>
            </span>

            <div className="flex-1" />

            {/* auto-next toggle */}
            <button
              onClick={() => setAutoNext((v) => !v)}
              aria-label="Auto-next"
              className={`focus-ring hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition md:flex ${
                autoNext ? 'bg-accent/80 text-white' : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}
            >
              Auto-next {autoNext ? 'ON' : 'OFF'}
            </button>

            {/* kecepatan */}
            <div className="relative">
              <button
                onClick={() => setSpeedOpen((v) => !v)}
                className="focus-ring rounded-md px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10"
              >
                {speed}×
              </button>
              <AnimatePresence>
                {speedOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute bottom-10 right-0 overflow-hidden rounded-md bg-black/85 p-1 backdrop-blur-md"
                  >
                    {SPEEDS.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          const video = videoRef.current;
                          if (video) video.playbackRate = s;
                          setSpeed(s);
                          setSpeedOpen(false);
                        }}
                        className={`[display:block] w-full rounded-md px-4 py-1.5 text-left text-xs font-medium transition hover:bg-white/10 ${
                          s === speed ? 'text-accent-soft' : 'text-white/85'
                        }`}
                      >
                        {s}×
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={toggleFullscreen} aria-label="Layar penuh" className="focus-ring rounded-md p-2 transition hover:bg-white/10">
              <IconFullscreen className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* tombol kembali (saat kontrol terlihat) */}
      <motion.div
        animate={{ opacity: controlsVisible ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="absolute left-3 top-3 md:left-5 md:top-5"
      >
        <Link
          href={`/series/${seriesSlug}`}
          aria-label="Kembali ke detail"
          className="focus-ring flex items-center gap-1.5 rounded-md bg-black/50 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/70"
        >
          <IconChevronLeft className="h-4 w-4" /> Detail
        </Link>
      </motion.div>

      {/* tombol tutup overlay next (saat fullscreen) */}
      {fullScreen && nextCountdown === null && (
        <div className="pointer-events-none absolute right-4 top-4 text-xs text-white/40">
          {episodeCount > 0 ? `${episode}/${episodeCount}` : ''}
        </div>
      )}
      <button
        aria-label="Tutup"
        className="hidden"
        onClick={() => setNextCountdown(null)}
      >
        <IconX />
      </button>
    </div>
  );
}
