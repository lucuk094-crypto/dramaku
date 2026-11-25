'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Lompat halaman dari sisi klien — dipakai rute detektor /buka/[slug]. */
export default function Goto({ to }: { to: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(to);
  }, [router, to]);
  return null;
}
