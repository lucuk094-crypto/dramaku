import Link from 'next/link';
import { getCategory, getNovelCategory } from '@/lib/melolo';
import { hasRsMap } from '@/lib/taxonomy';
import { MediaGrid, PageHeader } from '@/components/MediaRow';
import RsSection from '@/components/RsSection';
import DkSection from '@/components/DkSection';

export const revalidate = 600;

export default async function GenreDetailPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number.parseInt(searchParams.page || '1', 10) || 1);

  // Drama dulu; genre seperti werewolf/vampire/sci-fi/adventure hanya punya
  // koleksi novel di sumber, jadi fallback ke kategori novel.
  let data = await getCategory(params.slug, page).catch(() => ({
    genre: params.slug,
    page,
    total_pages: 1,
    has_next: false,
    items: [],
  }));
  let isNovel = false;

  if (data.items.length === 0) {
    const novels = await getNovelCategory(params.slug, page).catch(() => null);
    if (novels && novels.items.length > 0) {
      data = novels;
      isNovel = true;
    }
  }

  const pretty = params.slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const noun = isNovel ? 'novel' : 'drama';

  return (
    <div className="container-x pb-16 pt-8">
      <PageHeader
        eyebrow={`Genre ${isNovel ? 'novel' : 'drama'} — halaman ${data.page} / ${data.total_pages || 1}`}
        title={pretty}
        subtitle={`${data.items.length} ${noun} ditampilkan · Halaman ${data.page} dari ${data.total_pages || 1}`}
      />

      {isNovel && (
        <div className="panel mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3">
          <p className="mono text-soft">
            Info <b className="mono-accent font-normal">Genre novel</b>
          </p>
          <p className="text-sm text-muted">
            Genre ini tersedia sebagai koleksi novel di sumber konten — buku cerita bergambar, bukan video.
          </p>
        </div>
      )}

      {data.items.length > 0 ? (
        <MediaGrid items={data.items} />
      ) : !hasRsMap(params.slug) ? (
        <div className="panel pad text-center">
          <p className="mono text-soft">Belum ada judul</p>
          <p className="mt-3 text-muted">Belum ada {noun} di genre ini.</p>
        </div>
      ) : null}

      {/* Lengkapan katalog ReelShort — genre yang kosong/kurang lengkap */}
      <RsSection
        mapKey={params.slug}
        eyebrow={data.items.length === 0 ? 'Katalog Pilihan' : 'Lengkapan Katalog'}
        title={data.items.length === 0 ? `Katalog ${pretty} — Pilihan Unggulan` : `Lengkapan Koleksi ${pretty}`}
        className={data.items.length > 0 ? 'mt-14' : 'mt-4'}
      />

      {/* Lengkapan katalog Drakorku — drakor & drama Asia */}
      <DkSection
        query={params.slug}
        title={`Drakor & Drama Asia — ${pretty}`}
        className="mt-14"
      />
      {data.items.length === 0 && hasRsMap(params.slug) && (
        <p className="mt-8 text-sm text-muted">
          Katalog utama untuk genre ini masih kosong — pilihan di atas dikurasi khusus untukmu
          (diperbarui otomatis).
        </p>
      )}

      {/* paginasi */}
      <div className="mt-12 flex items-center justify-between border-t border-border/[var(--border-alpha)] pt-6">
        {data.page > 1 ? (
          <Link href={`/genres/${params.slug}?page=${data.page - 1}`} className="btn btn-ghost focus-ring">
            ← Sebelumnya
          </Link>
        ) : (
          <span />
        )}
        <p className="mono text-soft">
          Halaman <b className="mono-accent font-normal">{data.page}</b> / {data.total_pages || 1}
        </p>
        {data.has_next ? (
          <Link href={`/genres/${params.slug}?page=${data.page + 1}`} className="btn btn-ghost focus-ring">
            Berikutnya →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
