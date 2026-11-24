import Link from 'next/link';
import type { Metadata } from 'next';
import { dkSeriesBySlug, dkFindMeta, dkStripHtml, slugify } from '@/lib/drakorku';
import Reveal from '@/components/Reveal';
import { IconPlay } from '@/components/Icons';
import { scrubSource } from '@/lib/melolo';

export const revalidate = 1800;

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = await dkSeriesBySlug(params.slug).catch(() => null);
  const name = s?.name || params.slug.replace(/-/g, ' ');
  return {
    title: `${name} — Drakor & Drama Asia | DramaKu`,
    description: s?.synopsis?.slice(0, 150) || `Nonton ${name} subtitle Indonesia di DramaKu.`,
  };
}

export default async function DrakorkuSerialPage({ params }: Props) {
  const series = await dkSeriesBySlug(params.slug).catch(() => null);
  const meta = series ? null : await dkFindMeta(params.slug.replace(/-/g, ' ')).catch(() => null);

  const name = series?.name || meta?.title || params.slug.replace(/-/g, ' ');
  const cover = series?.cover || meta?.image || '';
  const landscape = series?.landscape || meta?.landscape || '';
  const genre = series?.genre || meta?.genre || 'Drama';
  const year = series?.year || meta?.year || 0;
  const rating = series?.rating || meta?.rating || 0;
  const status = series?.status || meta?.status || '';
  const trailer = series?.trailer || meta?.trailer || '';
  const synopsis = series?.synopsis || meta?.synopsis || '';
  const episodes = series?.episodes || [];
  const playable = episodes.length > 0;

  return (
    <div className="container-x pb-20 pt-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/drakorku" className="btn btn-ghost focus-ring">
          ← Katalog
        </Link>
        <Link href="/" className="btn btn-ghost focus-ring">
          Beranda
        </Link>
      </div>

      <Reveal className="mt-5">
        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <div className="media-poster relative overflow-hidden rounded-2xl border border-[--border] bg-[--soft]">
            <div className="aspect-[3/4] w-full">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt={name} className="h-full w-full object-cover" />
              ) : null}
              <div className="veil absolute inset-0" />
            </div>
          </div>

          <div>
            <p className="eyebrow">Koleksi Drama Asia</p>
            <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight md:text-4xl">{name}</h1>
            <p className="mono mt-2 text-xs uppercase tracking-wider text-[--muted]">
              {[genre, year || '', rating ? `★ ${rating}` : '', status, episodes.length ? `${episodes.length} episode` : '']
                .filter(Boolean)
                .join(' · ')}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {playable ? (
                <Link href={`/drakorku/tonton/${series!.slug}`} className="btn btn-primary focus-ring">
                  <IconPlay /> Tonton Episode 1
                </Link>
              ) : null}
              {trailer ? (
                <a href={trailer} target="_blank" rel="noopener noreferrer" className="btn btn-ghost focus-ring">
                  ▶ Tonton Trailer
                </a>
              ) : null}
              <a
                href={`https://mydramalist.com/search?q=${encodeURIComponent(name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost focus-ring"
              >
                Info Selengkapnya ↗
              </a>
            </div>

            {synopsis ? (
              <p className="mt-5 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-[--muted]">
                {scrubSource(dkStripHtml(synopsis, 1400))}
              </p>
            ) : null}
          </div>
        </div>
      </Reveal>

      {playable ? (
        <Reveal className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Semua Episode ({Math.max(series!.total, episodes.length)})</h2>
            <Link href={`/drakorku/tonton/${series!.slug}`} className="go text-sm text-[--accent]">
              Mode Geser (TikTok) →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
            {Array.from({ length: Math.max(series!.total, episodes[episodes.length - 1]?.n || 0) }, (_, i) => i + 1).map((n) => {
              const has = episodes.some((e) => e.n === n);
              return has ? (
                <Link
                  key={n}
                  href={`/drakorku/tonton/${series!.slug}?ep=${n}`}
                  title={`Episode ${n}`}
                  className="focus-ring flex aspect-square items-center justify-center rounded border border-[--border] bg-[--panel] font-mono text-xs tracking-mono transition hover:scale-[1.06] hover:border-[--accent]/60"
                >
                  {n}
                </Link>
              ) : (
                <span
                  key={n}
                  title={`Episode ${n} — belum rilis di sumber`}
                  className="flex aspect-square items-center justify-center rounded border border-dashed border-[--border] bg-[--panel]/40 font-mono text-xs tracking-mono text-[--muted]/60"
                >
                  <span className="flex flex-col items-center gap-[3px]">
                    <span>{n}</span>
                    <span className="rounded-full border border-[--muted]/50 bg-[--muted]/10 px-[2px] py-[1px] text-[6.5px] leading-none tracking-[0.03em] text-[--muted] sm:px-[3px] sm:text-[8px]">BELUM RILIS</span>
                  </span>
                </span>
              );
            })}
          </div>
        </Reveal>
      ) : (
        <Reveal className="mt-10">
          <div className="panel rounded-2xl p-6">
            <p className="text-sm leading-relaxed text-[--muted]">
              Serial ini belum tersedia untuk diputar langsung di web ini — silakan tonton trailernya
              di atas atau jelajahi judul serupa di katalog.
            </p>
          </div>
        </Reveal>
      )}
    </div>
  );
}
