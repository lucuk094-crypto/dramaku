import Link from 'next/link';
import type { Metadata } from 'next';
import { dkSeriesCards, dkCategoryCards, slugify } from '@/lib/drakorku';
import DkCard from '@/components/DkCard';
import Reveal from '@/components/Reveal';

export const dynamic = 'force-dynamic'; // render saat runtime — build bebas tarik data hulu

interface Props {
  searchParams: { q?: string };
}

export const metadata: Metadata = {
  title: 'Cari Drakor & Drama Asia | DramaKu',
  description: 'Pencarian serial drakor dan drama Asia — semua episode terbuka.',
};

export default async function DrakorkuCariPage({ searchParams }: Props) {
  const q = (searchParams.q || '').trim();
  const [series, catalog] = await Promise.all([
    q ? dkSeriesCards(q, 30).catch(() => []) : [],
    q
      ? Promise.all(
          ['Romance', 'Drama', 'Comedy', 'Action', 'Fantasy'].map((c) =>
            slugify(c) === slugify(q) ? dkCategoryCards(c).catch(() => []) : Promise.resolve([]),
          ),
        ).then((rows) => rows.flat())
      : [],
  ]);

  return (
    <div className="container-x pb-20 pt-8">
      <Reveal>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Pencarian</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              {q ? `Hasil untuk “${q}”` : 'Cari Drakor & Drama Asia'}
            </h1>
          </div>
          <Link href="/drakorku" className="btn btn-ghost focus-ring">
            ← Katalog
          </Link>
        </div>

        <form action="/drakorku/cari" className="mt-5 flex max-w-xl items-center gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Cari judul drakor…"
            className="focus-ring w-full rounded-xl border border-[--border] bg-[--panel] px-3 py-2 text-sm"
          />
          <button type="submit" className="btn btn-primary focus-ring">
            Cari
          </button>
        </form>
      </Reveal>

      {q && series.length === 0 && catalog.length === 0 && (
        <Reveal className="mt-10">
          <div className="panel rounded-2xl p-6 text-sm text-[--muted]">
            Tidak ada hasil untuk “{q}”. Coba kata kunci lain, misalnya nama drama Korea favoritmu.
          </div>
        </Reveal>
      )}

      {series.length > 0 && (
        <Reveal className="mt-10">
          <p className="eyebrow">Serial — Bisa Diputar ({series.length})</p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {series.map((s, i) => (
              <DkCard
                key={s.slug}
                index={i} fluid
                name={s.name}
                slug={s.slug}
                cover={s.cover}
                meta={[s.year || '', s.rating ? `★ ${s.rating}` : ''].filter(Boolean).join(' · ')}
                genreLine={s.genre}
                badge={s.playable ? 'Tonton' : 'Detail'}
                href={s.playable ? `/drakorku/tonton/${s.slug}` : `/drakorku/serial/${s.slug}`}
              />
            ))}
          </div>
        </Reveal>
      )}

      {catalog.length > 0 && (
        <Reveal className="mt-10">
          <p className="eyebrow">Katalog — Info & Trailer</p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {catalog.slice(0, 18).map((it, i) => (
              <DkCard
                key={it.catId}
                index={i} fluid
                name={it.title}
                slug={slugify(it.title)}
                cover={it.image}
                meta={`${it.year || ''}${it.rating ? ` · ★ ${it.rating}` : ''}`}
                genreLine={it.genre}
                badge="Detail"
                href={`/drakorku/serial/${slugify(it.title)}`}
              />
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}
