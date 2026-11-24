'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isFavorite, toggleFavorite } from '@/lib/store';
import { IconHeart, IconHeartFilled } from './Icons';

interface Props {
  slug: string;
  title: string | null;
  cover: string | null;
  rating: string | null;
  episode_count: number | null;
  className?: string;
}

export default function FavoriteButton({ slug, title, cover, rating, episode_count, className }: Props) {
  const [active, setActive] = useState(false);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    setActive(isFavorite(slug));
  }, [slug]);

  const onClick = () => {
    const now = toggleFavorite({ slug, title, cover, rating, episode_count });
    setActive(now);
    if (now) {
      setBurst(true);
      setTimeout(() => setBurst(false), 500);
    }
  };

  return (
    <button
      onClick={onClick}
      aria-label={active ? 'Hapus dari favorit' : 'Tambah ke favorit'}
      className={`btn btn-ghost focus-ring relative ${className || ''}`}
      style={
        active
          ? { borderColor: 'rgb(var(--accent) / 0.5)', background: 'rgb(var(--accent-bg))', color: 'rgb(var(--accent))' }
          : undefined
      }
    >
      <span className="relative flex h-5 w-5 items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={active ? 'filled' : 'outline'}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          >
            {active ? <IconHeartFilled className="h-[18px] w-[18px]" /> : <IconHeart className="h-[18px] w-[18px]" />}
          </motion.span>
        </AnimatePresence>
        <AnimatePresence>
          {burst && (
            <motion.span
              className="absolute inset-0 rounded-full bg-accent/40"
              initial={{ scale: 0.4, opacity: 0.9 }}
              animate={{ scale: 2.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </AnimatePresence>
      </span>
      {active ? 'Tersimpan' : 'Favorit'}
    </button>
  );
}
