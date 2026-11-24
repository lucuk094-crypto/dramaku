import Link from 'next/link';
import { getHome } from '@/lib/melolo';
import { KATEGORI_UTAMA, KARAKTER_UTAMA, JENIS } from '@/lib/taxonomy';
import { DK_CATEGORIES, slugify as dkSlug } from '@/lib/drakorku';
import { PageHeader } from '@/components/MediaRow';
import Reveal from '@/components/Reveal';

export const revalidate = 3600;

/** genre yang hanya berisi novel (tanpa video) tidak ditampilkan */
const HIDDEN_GENRES = new Set(['dokter']);

export default async function GenresPage() {
  const home = await getHome().catch(() => ({ genres: [] as any[], sections: [] }));
  const genres = home.genres.filter((g: any) => !HIDDEN_GENRES.has(g.slug));
  // jenis hanya yang benar-benar punya data video
  const jenisTampil = JENIS;

  return (
    <div className="container-x pb-20 pt-8">
      <PageHeader
        eyebrow="Indeks Lengkap"
        title="Genre & Kategori"
        subtitle="Semua pilihan genre, kategori, dan karakter dikumpulkan di satu tempat — urut, rapi, dan siap dijelajahi."
      />

      {/* JENIS */}
      <Reveal className="mt-10">
        <div className="head">
          <p className="eyebrow">Jenis</p>
          <h2 className="text-2xl tracking-tightest">Pilih Jenis</h2>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {jenisTampil.map((j, i) => (
            <Link
              key={j.type}
              href={`/jelajah/jenis/${j.type}`}
              className="panel panel-hover focus-ring group flex items-center justify-between gap-3 p-5"
            >
              <div>
                <p className="mono text-soft">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="mt-1.5 text-lg font-medium tracking-tight transition-colors group-hover:text-accent">
                  {j.name}
                </h3>
                <p className="mt-1 text-sm text-muted">{j.desc}</p>
              </div>
              <span className="go" aria-hidden />
            </Link>
          ))}
        </div>
      </Reveal>

      {/* GENRE VIDEO */}
      <Reveal className="mt-12">
        <div className="head">
          <p className="eyebrow">Genre</p>
          <h2 className="text-2xl tracking-tightest">Jelajah per Genre</h2>
          <div className="head-side">
            <p className="mono text-soft">{genres.length} genre</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {/* THRILLER posisi #1 — permintaan */}
          {genres
            .slice()
            .sort((a: any, b: any) => (a.slug === 'thriller' ? -1 : b.slug === 'thriller' ? 1 : 0))
            .map((genre: any, i: number) => (
              <Link
                key={genre.slug}
                href={`/genres/${genre.slug}`}
                className="panel panel-hover focus-ring group flex items-center justify-between gap-2 p-4 transition hover:scale-[1.02] hover:border-accent/50"
              >
                <div>
                  <p className="mono text-soft">{String(i + 1).padStart(2, '0')}</p>
                  <p className="mt-1 font-medium tracking-tight transition-colors group-hover:text-accent">{genre.name}</p>
                </div>
                <span className="go" aria-hidden />
              </Link>
            ))}
        </div>
      </Reveal>

      {/* KATEGORI */}
      <Reveal className="mt-12">
        <div className="head">
          <p className="eyebrow">Kategori</p>
          <h2 className="text-2xl tracking-tightest">Semua Kategori</h2>
          <div className="head-side">
            <p className="mono text-soft">{KATEGORI_UTAMA.length} kategori</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {KATEGORI_UTAMA.map((k) => (
            <Link
              key={k.tagId}
              href={`/jelajah/kategori/${k.tagId}`}
              className="go focus-ring rounded-full border border-[--border] px-3.5 py-1.5 text-sm hover:border-[--accent] hover:text-[--accent]"
            >
              {k.name}
            </Link>
          ))}
        </div>
      </Reveal>

      {/* KARAKTER */}
      <Reveal className="mt-12">
        <div className="head">
          <p className="eyebrow">Karakter</p>
          <h2 className="text-2xl tracking-tightest">Karakter Favorit</h2>
          <div className="head-side">
            <p className="mono text-soft">{KARAKTER_UTAMA.length} karakter</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {KARAKTER_UTAMA.map((c) => (
            <Link
              key={c.name}
              href={`/jelajah/kategori/${c.tagId}`}
              className="go focus-ring rounded-full border border-[--border] px-3.5 py-1.5 text-sm hover:border-[--accent] hover:text-[--accent]"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </Reveal>

      {/* GENRE DRAMA ASIA */}
      <Reveal className="mt-12">
        <div className="head">
          <p className="eyebrow">Drama Asia</p>
          <h2 className="text-2xl tracking-tightest">Genre Drama Asia</h2>
          <div className="head-side">
            <p className="mono text-soft">
              <a href="/drakorku" className="go focus-ring rounded">
                Katalog Lengkap
              </a>
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {DK_CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/drakorku/kategori/${dkSlug(c)}`}
              className="go focus-ring rounded-full border border-[--border] px-3.5 py-1.5 text-sm hover:border-[--accent] hover:text-[--accent]"
            >
              {c}
            </Link>
          ))}
        </div>
      </Reveal>

      {genres.length === 0 && (
        <div className="panel pad mt-10 text-center">
          <p className="mono text-soft">Sedang tidak tersedia</p>
          <p className="mt-3 text-muted">Daftar genre belum bisa dimuat saat ini.</p>
        </div>
      )}
    </div>
  );
}
