import Link from 'next/link';
import type { Metadata } from 'next';
import { frSearch, bridgeMany } from '@/lib/flickreels';
import FrCard from '@/components/FrCard';
import Reveal from '@/components/Reveal';

export const revalidate = 1800;

interface Props {
  searchParams: { kata?: string; hal?: string };
}

export const metadata: Metadata = {
  title: 'Pencarian Jelajah | DramaKu',
  description: 'Pencarian live lintas katalog — kategori, karakter, dan judul terbaru.',
};

export default async function CariJelajahPage({ searchParams }: Props) {
  const kata = (searchParams.kata || '').trim();
  const hal = Math.max(1, Number(searchParams.hal) || 1);

  const page = kata ? await frSearch(kata, hal, 24).catch(() => null) : null;
  const bridges = page ? await bridgeMany(page.items.map((x) => x.title)) : new Map();

  return (
    <div className="container-x pb-16 pt-4">
      <Reveal>
        <div className="head">
          <p className="eyebrow">Jelajah · Pencarian</p>
          <h1 className="text-3xl font-medium tracking-tightest">
            {kata ? `“${kata}”` : 'Cari istilah'}
          </h1>
          <p className="mt-2 max-w-2xl leading-relaxed text-muted">
            Hasil live dari katalog platform — mencakup judul, kategori, dan karakter.
          </p>
        </div>
      </Reveal>

      <Reveal className="mt-6">
        <form action="/jelajah/cari" className="panel flex items-center gap-2 p-3">
          <input
            type="text"
            name="kata"
            defaultValue={kata}
            placeholder="mis. amnesia, pertukaran jiwa, CEO…"
            className="w-full bg-transparent px-2 py-1.5 text-sm tracking-tight outline-none placeholder:text-soft"
          />
          <button type="submit" className="btn btn-main btn-sm focus-ring">
            Cari
          </button>
        </form>
      </Reveal>

      {kata && page && page.items.length > 0 && (
        <div className="mt-8 grid grid-cols-2 items-start gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {page.items.map((p, i) => (
            <FrCard key={p.playlet_id} item={p} meloloSlug={bridges.get(p.title)?.slug ?? null} index={i} fluid />
          ))}
        </div>
      )}

      {kata && page && page.items.length === 0 && (
        <div className="panel mt-8 p-8">
          <p className="eyebrow">Info</p>
          <p className="mt-2 leading-relaxed text-muted">
            Tidak ada hasil untuk “{kata}”. Coba istilah lain, atau lihat{' '}
            <Link href="/jelajah" className="text-accent underline-offset-4 hover:underline">
              kategori lengkap
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
