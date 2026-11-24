import type { Metadata } from 'next';
import { getNewSeries, type MediaCard } from '@/lib/melolo';
import MediaCardEl from '@/components/MediaCard';
import Reveal from '@/components/Reveal';

export const dynamic = 'force-dynamic'; // render saat runtime — build bebas tarik data hulu

export const metadata: Metadata = {
  title: 'Baru Tayang — Rilisan Terbaru 2026 | DramaKu',
  description:
    'Fitur Baru Tayang: rilisan dan pembaruan episode terbaru dari katalog, real-time dari rilis 2026 sampai seterusnya.',
};

function toMediaCard(n: {
  slug: string;
  title: string | null;
  cover: string | null;
  rating: string | null;
  episode_count: number | null;
  description: string | null;
  genres: { slug: string | null; name: string }[];
  updated: string | null;
  create_time: string | null;
}): MediaCard {
  return {
    type: 'series',
    slug: n.slug,
    title: n.title,
    cover: n.cover,
    rating: n.rating,
    rank: null,
    episode_count: n.episode_count,
    description: n.description,
    genres: n.genres,
    publish_date: n.updated,
    url: `/series/${n.slug}`,
  };
}

export default async function BaruTayangPage() {
  const news = await getNewSeries(48).catch(() => []);
  const tanggal = news[0]?.updated ?? null;

  return (
    <div className="container-x pb-16 pt-4">
      <Reveal>
        <div className="head">
          <p className="eyebrow">Baru Tayang</p>
          <h1 className="text-3xl font-medium tracking-tightest">Rilisan & Pembaruan Terbaru</h1>
          <p className="mt-2 max-w-2xl leading-relaxed text-muted">
            Diurutkan dari pembaruan terakhir di sumber — real-time, dari rilis 2026 sampai seterusnya.
            {tanggal ? ` Sinkron terakhir: ${tanggal}.` : ''}
          </p>
        </div>
      </Reveal>

      {news.length === 0 ? (
        <div className="panel mt-8 p-8">
          <p className="eyebrow">Info</p>
          <p className="mt-2 leading-relaxed text-muted">
            Data sedang mengikuti sumber. Muat ulang beberapa saat lagi.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 items-start gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {news.map((n, i) => (
            <MediaCardEl key={n.slug} item={toMediaCard(n)} index={i} fluid />
          ))}
        </div>
      )}

      <p className="mt-10 font-mono text-[11px] uppercase tracking-mono text-soft">
        {news.length} judul terbaru · diperbarui otomatis setiap 30 menit dari katalog sumber
      </p>
    </div>
  );
}
