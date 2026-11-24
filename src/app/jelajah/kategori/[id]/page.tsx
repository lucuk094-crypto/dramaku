import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getFrCategories, getFrPlaylets, bridgeMany } from '@/lib/flickreels';
import { KATEGORI_UTAMA, KARAKTER_UTAMA, hasRsMap } from '@/lib/taxonomy';
import FrCard from '@/components/FrCard';
import RsSection from '@/components/RsSection';
import DkSection from '@/components/DkSection';
import Reveal from '@/components/Reveal';

export const revalidate = 1800;

interface Props {
  params: { id: string };
  searchParams: { hal?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = Number(params.id);
  const cats = await getFrCategories().catch(() => []);
  const name = id === 0 ? 'Semua Judul' : (cats.find((c) => c.tag_id === id)?.name ?? 'Kategori');
  return {
    title: `${name.trim()} — Kategori | Jelajah DramaKu`,
    description: `Daftar terbaru kategori ${name.trim()} — diperbarui real-time dari katalog platform.`,
  };
}

export default async function KategoriPage({ params, searchParams }: Props) {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id < 0) notFound();
  const hal = Math.max(1, Number(searchParams.hal) || 1);
  const pageSize = 24;

  const cats = await getFrCategories().catch(() => []);
  const name = id === 0 ? 'Semua Judul' : (cats.find((c) => c.tag_id === id)?.name.trim() ?? `Kategori #${id}`);

  // nama taksonomi kami (untuk pemetaan ReelShort) — presisi via tagId
  const tax =
    [...KATEGORI_UTAMA, ...KARAKTER_UTAMA].find((t) => t.tagId === id) ?? null;
  const mapKey = tax?.name ?? name;

  const page = await getFrPlaylets(id, hal, pageSize).catch(() => null);
  if (!page) notFound();

  const bridges = await bridgeMany(page.items.map((x) => x.title));
  const totalPages = Math.max(1, Math.ceil(page.total / pageSize));

  return (
    <div className="container-x pb-16 pt-4">
      <Reveal>
        <div className="head">
          <p className="eyebrow">Kategori · Baru Tayang</p>
          <h1 className="text-3xl font-medium tracking-tightest">{name}</h1>
          <p className="mt-2 max-w-2xl leading-relaxed text-muted">
            {page.total.toLocaleString('id-ID')} judul · urut rilisan terbaru · halaman {hal}
            {totalPages > 1 ? ` dari ${totalPages}` : ''} · data real-time dari katalog platform.
          </p>
        </div>
      </Reveal>

      {page.items.length === 0 ? (
        <div className="panel mt-8 p-8">
          <p className="eyebrow">Info</p>
          <p className="mt-2 leading-relaxed text-muted">
            Belum ada judul di kategori ini untuk halaman ini. Coba halaman sebelumnya atau kembali ke{' '}
            <Link href="/jelajah" className="text-accent underline-offset-4 hover:underline">
              Jelajah
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 items-start gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {page.items.map((p, i) => (
            <FrCard key={p.playlet_id} item={p} meloloSlug={bridges.get(p.title)?.slug ?? null} index={i} fluid />
          ))}
        </div>
      )}

      {/* Lengkapan katalog ReelShort — kategori yang kosong/kurang lengkap */}
      <RsSection
        mapKey={mapKey}
        eyebrow="Lengkapan Katalog"
        title={`Lengkapan Koleksi ${name.trim()}`}
        className="mt-14"
      />

      {/* Lengkapan katalog Drakorku — drakor & drama Asia */}
      <DkSection
        query={mapKey}
        title={`Drakor & Drama Asia — ${name.trim()}`}
        className="mt-14"
      />

      <div className="mt-10 flex items-center justify-between gap-3">
        {hal > 1 ? (
          <Link href={`/jelajah/kategori/${id}?hal=${hal - 1}`} className="btn btn-ghost focus-ring">
            ← Halaman {hal - 1}
          </Link>
        ) : (
          <Link href="/jelajah" className="btn btn-ghost focus-ring">
            ← Jelajah
          </Link>
        )}
        {hal < totalPages ? (
          <Link href={`/jelajah/kategori/${id}?hal=${hal + 1}`} className="btn btn-main focus-ring">
            Halaman {hal + 1} →
          </Link>
        ) : (
          <span className="mono text-xs uppercase tracking-mono text-soft">Halaman terakhir</span>
        )}
      </div>
    </div>
  );
}
