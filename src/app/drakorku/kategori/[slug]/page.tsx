import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { dkCategoryCards, DK_CATEGORIES, slugify } from '@/lib/drakorku';
import DkCard from '@/components/DkCard';
import Reveal from '@/components/Reveal';

export const revalidate = 1800;

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return DK_CATEGORIES.map((c) => ({ slug: slugify(c) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = DK_CATEGORIES.find((c) => slugify(c) === params.slug);
  return {
    title: `${cat || 'Kategori'} — Drakor & Drama Asia | DramaKu`,
    description: `Daftar drakor dan drama Asia genre ${cat || params.slug}.`,
  };
}

export default async function DrakorkuKategoriPage({ params }: Props) {
  const cat = DK_CATEGORIES.find((c) => slugify(c) === params.slug);
  if (!cat) notFound();
  const items = await dkCategoryCards(cat);

  return (
    <div className="container-x pb-20 pt-8">
      <Reveal>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Kategori</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{cat}</h1>
            <p className="mono mt-1 text-xs uppercase tracking-wider text-[--muted]">
              {items.length} judul · katalog DramaKu
            </p>
          </div>
          <Link href="/drakorku" className="btn btn-ghost focus-ring">
            ← Semua Genre
          </Link>
        </div>
      </Reveal>

      {/* pintasan genre lain */}
      <Reveal className="mt-6">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {DK_CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/drakorku/kategori/${slugify(c)}`}
              className={`go focus-ring whitespace-nowrap rounded-full border px-3 py-1.5 text-xs ${
                c === cat ? 'border-[--accent] text-[--accent]' : 'border-[--border]'
              }`}
            >
              {c}
            </Link>
          ))}
        </div>
      </Reveal>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((it, i) => (
          <DkCard
            key={it.catId}
            index={i} fluid
            name={it.title}
            slug={slugify(it.title)}
            cover={it.image}
            meta={`${it.year || ''}${it.rating ? ` · ★ ${it.rating}` : ''}`}
            genreLine={it.genre}
            badge={it.status === 'Movie' ? 'Film' : 'Serial'}
            href={`/drakorku/serial/${slugify(it.title)}`}
          />
        ))}
      </div>
    </div>
  );
}
