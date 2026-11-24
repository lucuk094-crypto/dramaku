import Link from 'next/link';
import type { Metadata } from 'next';
import { dkCategoryCards, dkSeriesCards, DK_CATEGORIES, slugify } from '@/lib/drakorku';
import CarouselRow from '@/components/CarouselRow';
import DkCard from '@/components/DkCard';
import Reveal from '@/components/Reveal';

export const dynamic = 'force-dynamic'; // render saat runtime — build bebas tarik data hulu

export const metadata: Metadata = {
  title: 'Drakor & Drama Asia — Katalog Lengkap | DramaKu',
  description:
    'Katalog drakor dan drama Asia: 26 genre, ribuan judul, semua episode terbuka dan bisa diputar langsung di DramaKu.',
};

export default async function DrakorkuPage() {
  const [populer, romansa, series] = await Promise.all([
    dkCategoryCards('Drama').catch(() => []),
    dkCategoryCards('Romance').catch(() => []),
    dkSeriesCards('Eps 01', 24).catch(() => []),
  ]);

  return (
    <div className="container-x pb-20 pt-8">
      <Reveal>
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Koleksi Drama Asia</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Drakor &amp; Drama Asia
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[--muted]">
              26 genre · ribuan judul · serial lengkap dengan semua episode yang bisa diputar
              langsung di web ini. Pilih genre di bawah atau cari judul favoritmu.
            </p>
          </div>
          <form action="/drakorku/cari" className="flex items-center gap-2">
            <input
              type="search"
              name="q"
              placeholder="Cari judul drakor…"
              className="focus-ring w-52 rounded-xl border border-[--border] bg-[--panel] px-3 py-2 text-sm"
            />
            <button type="submit" className="btn btn-primary focus-ring">
              Cari
            </button>
          </form>
        </header>
      </Reveal>

      {/* 26 genre */}
      <Reveal className="mt-8">
        <p className="eyebrow">Semua Genre</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DK_CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/drakorku/kategori/${slugify(c)}`}
              className="go focus-ring rounded-full border border-[--border] px-3.5 py-1.5 text-sm hover:border-[--accent] hover:text-[--accent]"
            >
              {c}
            </Link>
          ))}
        </div>
      </Reveal>

      {/* serial langsung tonton */}
      {series.length > 0 && (
        <section className="mt-10">
          <div className="head">
            <p className="eyebrow">Tonton Langsung</p>
            <h2 className="text-2xl tracking-tightest">Serial — Semua Episode Terbuka</h2>
            <div className="head-side">
              <p className="mono text-soft">
                <a href="/drakorku" className="go focus-ring rounded">
                  Semua
                </a>
              </p>
            </div>
          </div>
          <CarouselRow>
            {series
              .filter((s) => s.playable)
              .slice(0, 18)
              .map((s, i) => (
                <DkCard
                  key={s.slug}
                  index={i}
                  name={s.name}
                  slug={s.slug}
                  cover={s.cover}
                  meta={[s.year || '', s.rating ? `★ ${s.rating}` : ''].filter(Boolean).join(' · ')}
                  genreLine={s.genre}
                  badge="Tonton"
                  href={`/drakorku/tonton/${s.slug}`}
                />
              ))}
          </CarouselRow>
        </section>
      )}

      {/* katalog per genre */}
      {populer.length > 0 && (
        <section className="mt-10">
          <div className="head">
            <p className="eyebrow">Katalog</p>
            <h2 className="text-2xl tracking-tightest">Drama Populer</h2>
            <div className="head-side">
              <p className="mono text-soft">
                <a href="/drakorku/kategori/drama" className="go focus-ring rounded">
                  Semua
                </a>
              </p>
            </div>
          </div>
          <CarouselRow>
            {populer.slice(0, 18).map((it, i) => (
              <DkCard
                key={it.catId}
                index={i}
                name={it.title}
                slug={slugify(it.title)}
                cover={it.image}
                meta={`${it.year || ''}${it.rating ? ` · ★ ${it.rating}` : ''}`}
                genreLine={it.genre}
                badge={it.status === 'Movie' ? 'Film' : 'Serial'}
                href={`/drakorku/serial/${slugify(it.title)}`}
              />
            ))}
          </CarouselRow>
        </section>
      )}

      {romansa.length > 0 && (
        <section className="mt-10">
          <div className="head">
            <p className="eyebrow">Katalog</p>
            <h2 className="text-2xl tracking-tightest">Romansa Pilihan</h2>
            <div className="head-side">
              <p className="mono text-soft">
                <a href="/drakorku/kategori/romance" className="go focus-ring rounded">
                  Semua
                </a>
              </p>
            </div>
          </div>
          <CarouselRow>
            {romansa.slice(0, 18).map((it, i) => (
              <DkCard
                key={it.catId}
                index={i}
                name={it.title}
                slug={slugify(it.title)}
                cover={it.image}
                meta={`${it.year || ''}${it.rating ? ` · ★ ${it.rating}` : ''}`}
                genreLine={it.genre}
                badge={it.status === 'Movie' ? 'Film' : 'Serial'}
                href={`/drakorku/serial/${slugify(it.title)}`}
              />
            ))}
          </CarouselRow>
        </section>
      )}
    </div>
  );
}
