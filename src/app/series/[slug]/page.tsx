import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSeries, scrubSource } from '@/lib/melolo';
import { fmtDate, fmtNumber } from '@/lib/format';
import FavoriteButton from '@/components/FavoriteButton';
import ResumeButton from '@/components/ResumeButton';
import EpisodeGrid from '@/components/EpisodeGrid';
import MediaRow from '@/components/MediaRow';
import Reveal from '@/components/Reveal';
import { IconPlay, IconStar } from '@/components/Icons';

export const revalidate = 600;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const s = await getSeries(params.slug);
    return {
      title: s.title || params.slug,
      description: s.short_description || s.description || `Nonton ${s.title} di DramaKu.`,
      openGraph: { title: s.title || params.slug, images: s.cover ? [s.cover] : [] },
    };
  } catch {
    return { title: 'Drama' };
  }
}

export default async function SeriesPage({ params }: { params: { slug: string } }) {
  let series;
  try {
    series = await getSeries(params.slug);
  } catch (err: any) {
    if (err?.status === 404) notFound();
    throw err;
  }

  return (
    <div className="pb-16">
      {/* ============ HERO ============ */}
      <div className="relative">
        {/* latar blur */}
        <div className="absolute inset-x-0 top-0 h-[440px] overflow-hidden">
          {series.cover && (
            <img src={series.cover} alt="" aria-hidden className="h-full w-full scale-110 object-cover opacity-[0.15] blur-2xl" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-bg/50 via-bg/85 to-bg" />
        </div>

        <div className="container-x relative pt-10">
          <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
            {/* poster */}
            <div className="mx-auto w-52 shrink-0 lg:mx-0 lg:w-60">
              <div className="panel panel-hover relative overflow-hidden">
                {series.cover ? (
                  <img src={series.cover} alt={series.title || ''} className="aspect-[2/3] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[2/3] w-full items-center justify-center bg-accent-bg text-5xl font-black text-accent/40">
                    {(series.title || '?')[0]}
                  </div>
                )}
              </div>
            </div>

            {/* info */}
            <div className="min-w-0">
              <p className="eyebrow">
                Serial · {series.episode_count} episode{series.country ? ` · ${series.country}` : ''}
              </p>
              <h1 className="mt-4 text-4xl font-medium leading-[1.04] tracking-tightest">
                {series.title}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
                {series.rating && (
                  <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-mono text-accent">
                    <IconStar className="h-4 w-4" /> {series.rating}
                    <span className="text-soft">({fmtNumber(series.reviewers)} ulasan)</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-mono text-soft">
                  <IconPlay className="h-3.5 w-3.5" /> {series.episode_count} Episode
                </span>
                {series.release_date && (
                  <span className="font-mono text-xs uppercase tracking-mono text-soft">{fmtDate(series.release_date)}</span>
                )}
              </div>

              {/* genre */}
              <div className="mt-4 flex flex-wrap gap-2">
                {series.genres.map((g) => (
                  <Link
                    key={g.slug || g.name}
                    href={g.slug ? `/genres/${g.slug}` : '/genres'}
                    className="chip chip-accent focus-ring"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>

              {/* sinopsis */}
              <div className="mt-7 max-w-3xl">
                <h2 className="mono text-soft">Sinopsis</h2>
                <p className="mt-2.5 leading-relaxed text-fg/85">
                  {scrubSource(series.description || series.short_description || '') || 'Sinopsis belum tersedia.'}
                </p>
                {series.story_plot &&
                  series.story_plot !== series.description &&
                  String(series.story_plot).trim().length > 40 && (
                  <p className="mt-3 leading-relaxed text-muted">{String(series.story_plot)}</p>
                )}
              </div>

              {/* aksi */}
              <div className="mt-8 flex flex-wrap items-center gap-2">
                <Link href={`/watch/${series.series_slug}/1`} className="btn btn-main focus-ring">
                  <IconPlay className="h-4 w-4" />
                  Tonton Episode 1
                </Link>
                <ResumeButton slug={series.series_slug} episodeCount={series.episode_count} />
                <FavoriteButton
                  slug={series.series_slug}
                  title={series.title}
                  cover={series.cover}
                  rating={series.rating}
                  episode_count={series.episode_count}
                />
              </div>

              {/* pemeran */}
              {series.cast?.length > 0 && (
                <div className="mt-7">
                  <h2 className="mono text-soft">Pemeran</h2>
                  <p className="mt-2 text-sm text-fg/80">{series.cast.join(' · ')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============ EPISODE ============ */}
      <Reveal className="container-x mt-16">
        <div className="head">
          <p className="eyebrow">Daftar episode</p>
          <h2>Episode</h2>
          <div className="head-side">
            <p className="mono text-soft">
              Total <b className="mono-accent font-normal">{series.episode_count}</b> episode
            </p>
          </div>
        </div>
        <EpisodeGrid slug={series.series_slug} episodes={series.episodes} />
      </Reveal>

      {/* ============ GALERI ============ */}
      {series.photos.length > 0 && (
        <Reveal className="container-x mt-16">
          <div className="head">
            <p className="eyebrow">Cuplikan</p>
            <h2>Galeri</h2>
          </div>
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
            {series.photos.map((photo, i) => (
              <figure key={i} className="panel panel-hover shrink-0 overflow-hidden">
                <img
                  src={photo}
                  alt={`Galeri ${i + 1}`}
                  loading="lazy"
                  className="h-44 w-auto object-cover"
                />
              </figure>
            ))}
          </div>
        </Reveal>
      )}

      {/* ============ REKOMENDASI ============ */}
      <div className="container-x mt-16 space-y-16">
        {series.recommendations.length > 0 && (
          <Reveal>
            <MediaRow title="Kamu Mungkin Suka" items={series.recommendations} wide eyebrow="Rekomendasi" />
          </Reveal>
        )}
        {series.platform_series.length > 0 && (
          <Reveal>
            <MediaRow title="Populer di Platform" items={series.platform_series} wide eyebrow="Pilihan platform" />
          </Reveal>
        )}
        {series.recommended_articles.length > 0 && (
          <Reveal>
            <MediaRow title="Artikel Terkait" items={series.recommended_articles} wide eyebrow="Bacaan" />
          </Reveal>
        )}
      </div>

      {/* ============ INFO TAMBAHAN ============ */}
      <Reveal className="container-x mt-16">
        <div className="panel pad">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Spesifikasi</p>
              <h2 className="mt-2 text-xl font-medium tracking-tight">Informasi</h2>
            </div>
            <p className="mono text-soft">Ref — {series.series_slug}</p>
          </div>

          <ul className="ticks mt-5">
            <li>
              <span className="mono text-soft">Judul</span>
              <b className="ml-auto text-right text-sm font-medium">{series.title || '-'}</b>
            </li>
            <li>
              <span className="mono text-soft">Jumlah episode</span>
              <b className="ml-auto text-right text-sm font-medium">{series.episode_count}</b>
            </li>
            <li>
              <span className="mono text-soft">Rating</span>
              <b className="ml-auto text-right text-sm font-medium text-accent">{series.rating || '-'}</b>
            </li>
            <li>
              <span className="mono text-soft">Rilis</span>
              <b className="ml-auto text-right text-sm font-medium">{fmtDate(series.release_date)}</b>
            </li>
            <li>
              <span className="mono text-soft">Negara</span>
              <b className="ml-auto text-right text-sm font-medium">{series.country || '-'}</b>
            </li>
            <li>
              <span className="mono text-soft">Bahasa</span>
              <b className="ml-auto text-right text-sm font-medium">{series.languages.join(', ') || '-'}</b>
            </li>
          </ul>

          {series.dubbed_versions.length > 0 && (
            <div className="mt-6">
              <h3 className="mono text-soft">Versi tersedia</h3>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {series.dubbed_versions.map((v, i) => (
                  <span key={i} className="chip">
                    {v.language?.toUpperCase() || 'ID'}
                    {v.platform ? ` · ${v.platform}` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
