import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSeries } from '@/lib/melolo';
import EpisodeFeed from '@/components/EpisodeFeed';
import EpisodeGrid from '@/components/EpisodeGrid';
import MediaRow from '@/components/MediaRow';
import Reveal from '@/components/Reveal';
import WatchMetaBar from '@/components/WatchMetaBar';

export const revalidate = 600;

export async function generateMetadata({ params }: { params: { slug: string; ep: string } }): Promise<Metadata> {
  try {
    const s = await getSeries(params.slug);
    return { title: `Nonton ${s.title} — Episode ${params.ep}` };
  } catch {
    return { title: 'Nonton' };
  }
}

export default async function WatchPage({ params }: { params: { slug: string; ep: string } }) {
  const ep = Math.max(1, Number.parseInt(params.ep, 10) || 1);

  let series;
  try {
    series = await getSeries(params.slug, ep);
  } catch (err: any) {
    if (err?.status === 404) notFound();
    throw err;
  }

  if (ep > series.episode_count) notFound();

  // Tidak ada satupun episode yang tersedia → panel info + daftar episode
  if (series.availableCount === 0) {
    return (
      <div className="container-x pb-16 pt-6">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="panel p-8">
              <p className="eyebrow">Info</p>
              <h1 className="mt-2 text-2xl font-medium tracking-tightest">
                Episode ini segera dirilis
              </h1>
              <p className="mt-3 max-w-2xl leading-relaxed text-muted">
                {series.title} memiliki {series.episode_count} episode, tetapi belum ada stream yang tersedia
                untuk diputar saat ini. Coba lagi nanti — daftar episode tetap bisa dilihat di bawah.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Link href={`/series/${series.series_slug}`} className="btn btn-main focus-ring">
                  ← Kembali ke detail
                </Link>
                <Link href="/genres" className="btn btn-ghost focus-ring">
                  Cari judul lain
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal className="mt-12">
            <div className="head">
              <p className="eyebrow">Navigasi</p>
              <h2>Daftar Episode</h2>
            </div>
            <EpisodeGrid slug={series.series_slug} episodes={series.episodes} />
          </Reveal>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* pemutar full-screen ala TikTok/melolo — penomoran LENGKAP 1..N */}
      <EpisodeFeed
        seriesSlug={series.series_slug}
        title={series.title}
        cover={series.cover}
        episodeCount={series.episode_count}
        availableCount={series.availableCount}
        startEp={ep}
      />

      {/* judul & navigasi cepat — tampil di desktop; di mobile lewat tombol Detail */}
      <div className="container-x hidden pb-16 pt-6 md:block">
        <div className="mx-auto max-w-5xl">
          <WatchMetaBar
            slug={series.series_slug}
            title={series.title}
            initialEp={ep}
            availableCount={series.availableCount}
            episodeCount={series.episode_count}
            rating={series.rating}
            shortDescription={series.short_description}
          />

          {/* episode lain */}
          <Reveal className="mt-14">
            <div className="head">
              <p className="eyebrow">Navigasi</p>
              <h2>Episode Lainnya</h2>
            </div>
            <EpisodeGrid slug={series.series_slug} episodes={series.episodes} />
          </Reveal>

          {series.recommendations.length > 0 && (
            <div className="mt-16">
              <MediaRow title="Tonton Juga" items={series.recommendations} wide eyebrow="Rekomendasi" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
