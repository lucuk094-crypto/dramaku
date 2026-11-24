'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

/** Keadaan kosong — panel instrumen dengan label mono. */
export default function EmptyState({
  title,
  description,
  cta,
  href,
  icon,
}: {
  title: string;
  description: string;
  cta?: string;
  href?: string;
  icon?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="panel pad flex flex-col items-center gap-4 text-center"
    >
      <p className="mono text-soft">Status — kosong</p>
      <motion.div
        className="flex h-16 w-16 items-center justify-center rounded bg-accent-bg text-accent"
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      >
        {icon || (
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.6}>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M8 10h8M8 14h5" strokeLinecap="round" />
          </svg>
        )}
      </motion.div>
      <h2 className="text-lg font-medium tracking-tight">{title}</h2>
      <p className="max-w-sm text-sm text-muted">{description}</p>
      {cta && href && (
        <Link href={href} className="btn btn-main focus-ring mt-2">
          {cta}
        </Link>
      )}
    </motion.div>
  );
}
