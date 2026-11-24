import Link from 'next/link';
import type { Metadata } from 'next';
import Reveal from '@/components/Reveal';
import { dbBrowse, dbCategories } from '@/lib/dramabox';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Katalog Drama Pendek | DramaKu',
  description:
    'Katalog lengkap drama pendek — 2.000+ judul, 50 genre, semua episode yang tersedia gratis terbuka dan bisa diputar langsung di web ini.',
};

interface Props {
  searchParams: { g?: string; hal?: string };
}

export default async function DramaboxCatalogPage({ searchParams }: Props) {
  const genreId = Math.max(0, Number(searchParams.g || 0) || 0);
  const hal = Math.max(1, Number(searchParams.hal || 1) || 1);

  const [cats, page] = await Promise.all([
    dbCategories().catch(() => ({ total: 0, genres: [] as { id: number; name: string; slug: string }[] })),
    dbBrowse(genreId, hal).catch(() => null),
  ]);

  const books = page?.books || [];
  const totalPages = page?.totalPages || 1;
  const activeName = genreId ? cats.genres.find((g) => g.id === genreId)?.name || '' : 'Semua';

  const pageLink = (n: number) => `/dramabox?g=${genreId || ''}&hal=${n}`;

  return (
    <div className="container-x pb-16 pt-6">
      <Reveal>
        <div className="head">
          <p className="eyebrow">Katalog</p>
          <h1 className="text-3xl tracking-tightest">Katalog Drama Pendek</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Ribuan judul drama pendek, diperbarui otomatis. Semua episode yang tersedia gratis
            <span className="text-accent"> terbuka dan bisa diputar langsung </span>
            di web ini.
          </p>
        </div>
      </Reveal>

      {/* genre */}
      <Reveal className="mt-8">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dramabox"
            className={`focus-ring rounded-full border px-3 py-1.5 text-xs transition ${
              genreId === 0
                ? 'border-[--accent] bg-[--accent] text-[rgb(var(--btn-text))]'
                : 'border-[--border] text-[--muted] hover:border-[--accent]/60 hover:text-[--fg]'
            }`}
          >
            Semua
          </Link>
          {cats.genres.map((g) => (
            <Link
              key={g.id}
              href={`/dramabox?g=${g.id}`}
              className={`focus-ring rounded-full border px-3 py-1.5 text-xs transition ${
                genreId === g.id
                  ? 'border-[--accent] bg-[--accent] text-[rgb(var(--btn-text))]'
                  : 'border-[--border] text-[--muted] hover:border-[--accent]/60 hover:text-[--fg]'
              }`}
            >
              {g.name}
            </Link>
          ))}
        </div>
      </Reveal>

      {/* grid judul */}
      <Reveal className="mt-10">
        <div className="head">
          <p className="eyebrow">Daftar Judul</p>
          <h2 className="text-2xl tracking-tightest">
            {activeName} <span className="text-soft">· halaman {hal} dari {totalPages}</span>
          </h2>
        </div>

        {books.length === 0 ? (
          <div className="panel pad mt-6 text-center">
            <p className="mono text-soft">Belum ada judul</p>
            <p className="mt-3 text-muted">Coba genre lain atau kembali lagi nanti.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {books.map((b, i) => (
              <Link
                key={b.bookId}
                href={`/dramabox/judul/${b.bookId}`}
                className="panel panel-hover focus-ring group overflow-hidden"
              >
                <div className="media-poster relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.cover}
                    alt={b.title}
                    loading={i < 8 ? 'eager' : 'lazy'}
                    className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.06]"
                  />
                  <div className="veil absolute inset-0" />
                  {b.rating ? (
                    <span className="absolute left-2 top-2 rounded-sm bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white">
                      ★ {Number(b.rating).toFixed(1)}
                    </span>
                  ) : null}
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-medium leading-snug tracking-tight">{b.title}</h3>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-mono text-soft">
                    {b.chapterCount > 0 ? `${b.chapterCount} episode` : 'episode lengkap'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Reveal>

      {/* paginasi */}
      {totalPages > 1 && (
        <Reveal className="mt-10">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {hal > 1 && (
              <Link href={pageLink(hal - 1)} className="btn btn-ghost btn-sm focus-ring">
                ← Sebelumnya
              </Link>
            )}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(hal - 2, totalPages - 4));
              const n = start + i;
              if (n > totalPages) return null;
              return (
                <Link
                  key={n}
                  href={pageLink(n)}
                  className={`focus-ring flex h-8 w-8 items-center justify-center rounded border font-mono text-xs ${
                    n === hal
                      ? 'border-[--accent] bg-[--accent] text-[rgb(var(--btn-text))]'
                      : 'border-[--border] text-[--muted] hover:border-[--accent]/60'
                  }`}
                >
                  {n}
                </Link>
              );
            })}
            {hal < totalPages && (
              <Link href={pageLink(hal + 1)} className="btn btn-ghost btn-sm focus-ring">
                Berikutnya →
              </Link>
            )}
          </div>
        </Reveal>
      )}
    </div>
  );
}
