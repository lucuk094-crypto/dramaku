'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[70vh] flex-col items-center justify-center py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="panel pad w-full max-w-xl text-center"
      >
        <p className="eyebrow justify-center">Error — 404</p>

        <div className="relative mt-6">
          <div className="select-none font-mono text-[7rem] font-medium leading-none tracking-tightest text-accent">
            404
          </div>
          <motion.div
            className="absolute right-8 top-2 h-2 w-2 rounded-full bg-accent"
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          />
        </div>

        <h1 className="mt-4 text-2xl font-medium tracking-tight">Halaman tidak ditemukan</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          Sepertinya halaman yang kamu cari sudah dipindahkan atau tidak pernah ada.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link href="/" className="btn btn-main focus-ring">
            Kembali ke Beranda
          </Link>
          <Link href="/search" className="btn btn-ghost focus-ring">
            Cari Drama
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
