import Link from 'next/link';
import type { Metadata } from 'next';
import { getRsAllBooks } from '@/lib/reelshort';
import { bridgeMany } from '@/lib/flickreels';
import RsCard from '@/components/RsCard';
import Reveal from '@/components/Reveal';
import { PageHeader } from '@/components/MediaRow';

export const revalidate = 900;

export const metadata: Metadata = {
  title: 'Semua Judul | DramaKu',
  description:
    'Katalog lengkap — 3.600+ judul dari rilisan terbaru sampai tahun-tahun sebelumnya. Semua episode bisa diputar langsung di DramaKu.',
};

interface Props {
  searchParams: { hal?: string };
}

/** Katalog lengkap ReelShort (per halaman 12, total ~300 halaman). */
export default async function ReelShortIndexPage({ searchParams }: Props) {
  const hal = Math.max(1, Number.parseInt(searchParams.hal || '1', 10) || 1);
  const page = await getRsAllBooks(hal).catch(() => null);
  const items = page?.items || [];
  const totalPages = Math.max(1, page?.totalPage || 1);
  const bridges = items.length
    ? await bridgeMany(items.map((b) => b.title)).catch(() => new Map())
    : new Map();

  return (
    <div className="container-x pb-16 pt-4">
      <Reveal>
        <PageHeader
          eyebrow="Katalog Lengkap — Diperbarui Otomatis"
          title="Semua Judul"
          subtitle={`${
            page?.total ? page.total.toLocaleString('id-ID') : '—'
          } judul · rilisan terbaru sampai tahun-tahun sebelumnya · semua episode terbuka dan bisa diputar di web ini · halaman ${hal} dari ${totalPages}.`}
        />
      </Reveal>

      {items.length > 0 ? (
        <div className="mt-2 grid grid-cols-2 items-start gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
          {items.map((b, i) => (
            <RsCard key={b.id} item={b} meloloSlug={bridges.get(b.title)?.slug ?? null} index={i} fluid />
          ))}
        </div>
      ) : (
        <div className="panel pad text-center">
          <p className="mono text-soft">Status — kosong</p>
          <p className="mt-3 text-muted">Katalog tidak dapat dimuat saat ini. Coba lagi nanti.</p>
        </div>
      )}

      {/* paginasi */}
      <div className="mt-12 flex items-center justify-between border-t border-border/[var(--border-alpha)] pt-6">
        {hal > 1 ? (
          <Link href={`/reelshort?hal=${hal - 1}`} className="btn btn-ghost focus-ring">
            ← Halaman {hal - 1}
          </Link>
        ) : (
          <Link href="/jelajah" className="btn btn-ghost focus-ring">
            ← Jelajah
          </Link>
        )}
        <p className="mono text-soft">
          Halaman <b className="mono-accent font-normal">{hal}</b> / {totalPages}
        </p>
        {hal < totalPages ? (
          <Link href={`/reelshort?hal=${hal + 1}`} className="btn btn-main focus-ring">
            Halaman {hal + 1} →
          </Link>
        ) : (
          <span className="mono text-xs uppercase tracking-mono text-soft">Halaman terakhir</span>
        )}
      </div>
    </div>
  );
}
