'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { IconChevronLeft, IconChevronRight } from './Icons';

interface Props {
  children: React.ReactNode;
  /** tinggi bantalan vertikal scroll area */
  className?: string;
}

/**
 * Shell carousel — gaya animasi yang diminta:
 *  - geser mulus (scroll-smooth) tanpa scrollbar, sentuh/trackpad bebas
 *  - kartu masuk berurutan (fade-up bertahap)
 *  - panah bulat kiri/kanan dengan status aktif/nonaktif
 *  - gradien tepi sebagai isyarat isi lebih banyak
 */
export default function CarouselRow({ children, className = '' }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const check = () => {
    const el = scroller.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    check();
    const el = scroller.current;
    if (!el) return;
    const onResize = () => check();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const nudge = (dir: -1 | 1) => {
    scroller.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* gradien tepi */}
      <div
        aria-hidden
        className={`pointer-events-none absolute left-0 top-0 z-20 h-full w-8 bg-gradient-to-r from-[rgb(var(--bg))] to-transparent transition-opacity duration-300 md:w-14 ${
          canLeft ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute right-0 top-0 z-20 h-full w-10 bg-gradient-to-l from-[rgb(var(--bg))] to-transparent transition-opacity duration-300 md:w-16 ${
          canRight ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        ref={scroller}
        onScroll={check}
        className="no-scrollbar flex snap-x snap-mandatory items-start gap-3 overflow-x-auto overscroll-x-auto scroll-smooth pb-2 pt-1"
      >
        {React.Children.map(children, (child, index) => (
          <div key={index} className="snap-start rounded-3xl last:pr-[6%] md:last:pr-[24%]">
            {child}
          </div>
        ))}
      </div>

      {/* panah bulat — gaya tombol carousel yang diminta */}
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => nudge(-1)}
          disabled={!canLeft}
          aria-label="Geser kiri"
          className="focus-ring relative z-30 flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(var(--fg))] text-[rgb(var(--bg))] transition-all duration-200 hover:opacity-80 disabled:opacity-25"
        >
          <IconChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => nudge(1)}
          disabled={!canRight}
          aria-label="Geser kanan"
          className="focus-ring relative z-30 flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(var(--fg))] text-[rgb(var(--bg))] transition-all duration-200 hover:opacity-80 disabled:opacity-25"
        >
          <IconChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
