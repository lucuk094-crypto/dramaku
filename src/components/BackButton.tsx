'use client';

import { useRouter } from 'next/navigation';

/** Tombol kembali — ada di setiap halaman. Fallback ke beranda bila tak ada riwayat. */
export default function BackButton({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label="Kembali ke halaman sebelumnya"
      onClick={() => {
        if (typeof window !== 'undefined' && window.history.length > 1) router.back();
        else router.push('/');
      }}
      className={`btn btn-ghost btn-sm focus-ring ${className}`}
    >
      <span aria-hidden className="text-sm leading-none">
        ←
      </span>
      {!compact && <span className="font-mono text-xs uppercase tracking-mono">Kembali</span>}
    </button>
  );
}
