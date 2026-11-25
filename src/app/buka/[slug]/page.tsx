import { redirect } from 'next/navigation';
import { getNovel, getSeries } from '@/lib/melolo';
import Goto from '@/components/Goto';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Membuka… — DramaKu' };

/**
 * Deteksi jenis judul untuk favorit lama (tersimpan tanpa tanda jenis):
 * seri → novel → DramaBox → pencarian. Tujuan akhir selalu halaman DramaKu.
 */
export default async function BukaPage({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug);
  if (!slug) redirect('/genres');

  if (slug.startsWith('db-')) redirect(`/dramabox/judul/${slug.slice(3)}`);

  // Catatan: redirect() melempar error internal Next — jangan taruh di dalam try/catch.
  let kind: 'series' | 'novels' | null = null;
  try {
    await getSeries(slug, 1);
    kind = 'series';
  } catch {
    /* bukan seri */
  }
  try {
    if (!kind) {
      await getNovel(slug);
      kind = 'novels';
    }
  } catch {
    /* bukan novel */
  }

  const target =
    kind === 'series'
      ? `/series/${slug}`
      : kind === 'novels'
        ? `/novels/${slug}`
        : /^\d+$/.test(slug)
          ? `/dramabox/judul/${slug}`
          : `/search?q=${encodeURIComponent(slug)}`;

  // Tiga jalur lompat: meta-refresh (HTML penuh), Goto (navigasi klien), tautan manual.
  return (
    <div className="container-x flex min-h-[50vh] flex-col items-center justify-center gap-4 pb-16 pt-8 text-center">
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <meta httpEquiv="refresh" content={`0;url=${target}`} />
      <Goto to={target} />
      <p className="eyebrow">Membuka</p>
      <h1 className="text-2xl tracking-tightest">{slug.replace(/-/g, ' ')}</h1>
      <p className="text-muted">Mengalihkan ke halaman yang benar…</p>
      <a href={target} className="btn btn-main focus-ring">
        Buka sekarang →
      </a>
    </div>
  );
}
