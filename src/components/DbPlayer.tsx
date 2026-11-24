'use client';

import { useEffect, useRef, useState } from 'react';
import { getProgress, saveProgress } from '@/lib/store';

/**
 * Pemutar DramaBox — tiga mode:
 *  - mp4 langsung (stream penuh / cuplikan 15 detik)
 *  - sematan YouTube (unggahan resmi)
 * Riwayat tonton + posisi lanjut menonton tercatat otomatis.
 */
interface Props {
  kind: 'db' | 'melolo' | 'preview' | 'youtube';
  url?: string;
  videoId?: string;
  title: string;
  cover?: string;
  /** kunci riwayat tonton, mis. `db-41000119953` */
  slug: string;
  episode: number;
  episodeCount: number;
  note?: string;
  /** Isi penuh induk (mode potret full-screen). */
  fill?: boolean;
}

export default function DbPlayer({ kind, url, videoId, title, cover, slug, episode, episodeCount, note, fill = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  const lastSave = useRef(0);

  useEffect(() => {
    if (kind === 'youtube') return;
    const saved = getProgress(slug);
    if (saved && saved.episode === episode && saved.position > 5 && saved.position < (saved.duration || Infinity) - 10) {
      setResumeAt(saved.position);
    } else {
      setResumeAt(null);
    }
  }, [slug, episode, kind]);

  useEffect(() => {
    if (kind === 'youtube') return;
    const video = videoRef.current;
    if (!video) return;

    const save = (final = false) => {
      if (!video.duration || Number.isNaN(video.duration)) return;
      saveProgress({
        slug,
        title,
        cover: cover || null,
        episode,
        episode_count: episodeCount,
        position: video.currentTime,
        duration: video.duration,
        url: `/dramabox/tonton/${slug.replace(/^db-/, '')}?ep=${episode}`,
        src: 'drama',
      });
      if (final) lastSave.current = Date.now();
    };

    const onTime = () => {
      const now = Date.now();
      if (now - lastSave.current > 5000) {
        lastSave.current = now;
        save();
      }
    };
    const onMeta = () => {
      if (resumeAt && video.currentTime < 1) video.currentTime = resumeAt;
      save();
    };
    const onSeeked = () => save();

    video.addEventListener('timeupdate', onTime);
    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('pause', () => save(true));
    return () => {
      save(true);
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('seeked', onSeeked);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, episode, kind, title, cover, episodeCount, resumeAt]);

  return (
    <div className={fill ? 'h-full w-full bg-black' : 'panel overflow-hidden'}>
      {!fill && note && (
        <div className="flex items-center gap-2 border-b border-[--border] bg-[--soft]/5 px-4 py-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[--accent]" />
          <p className="font-mono text-[11px] uppercase tracking-mono text-[--muted]">{note}</p>
        </div>
      )}

      <div className={fill ? 'relative h-full w-full bg-black' : 'relative aspect-video w-full bg-black'}>
        {kind === 'youtube' && videoId ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : url ? (
          <video
            ref={videoRef}
            key={`${slug}-${episode}`}
            className="absolute inset-0 h-full w-full object-contain"
            src={url}
            poster={cover}
            controls
            autoPlay
            playsInline
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
            <p className="font-mono text-xs uppercase tracking-mono text-[--muted]">Cuplikan tidak tersedia</p>
            <p className="text-sm text-[--muted]">Episode premium — lihat kotak berbadge PREMIUM di daftar episode.</p>
          </div>
        )}
      </div>
    </div>
  );
}
