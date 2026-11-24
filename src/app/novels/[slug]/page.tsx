import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getNovel, scrubSource } from '@/lib/melolo';
import FavoriteButton from '@/components/FavoriteButton';
import NovelReadButton from '@/components/NovelReadButton';
import Reveal from '@/components/Reveal';
import { IconStar } from '@/components/Icons';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const n = await getNovel(params.slug);
    return { title: n.title || 'Novel' };
  } catch {
    return { title: 'Novel' };
  }
}

export default async function NovelPage({ params }: { params: { slug: string } }) {
  let novel;
  try {
    novel = await getNovel(params.slug);
  } catch (err: any) {
    if (err?.status === 404) notFound();
    throw err;
  }

  const totalBab = novel.total_chapters ?? novel.available_chapters;
  const chapters = Array.from({ length: totalBab }, (_, i) => i + 1);

  return (
    <div className="container-x pb-16 pt-10">
      <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-[200px_minmax(0,1fr)] md:gap-12">
        {/* sampul */}
        <div className="mx-auto w-48 shrink-0 md:mx-0 md:w-52">
          <div className="panel panel-hover relative overflow-hidden">
            {novel.cover ? (
              <img src={novel.cover} alt={novel.title || ''} className="aspect-[2/3] w-full object-cover" />
            ) : (
              <div className="flex aspect-[2/3] w-full items-center justify-center bg-accent-bg text-5xl font-black text-accent/40">
                {(novel.title || '?')[0]}
              </div>
            )}
          </div>
        </div>

        {/* detail */}
        <div className="min-w-0">
          <p className="eyebrow">Novel — bacaan</p>
          <h1 className="mt-4 text-4xl font-medium leading-[1.04] tracking-tightest">{novel.title}</h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
            {novel.rating && (
              <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-mono text-accent">
                <IconStar className="h-4 w-4" /> {novel.rating}
              </span>
            )}
            {novel.total_chapters !== null && (
              <span className="font-mono text-xs uppercase tracking-mono text-soft">
                {novel.available_chapters === novel.total_chapters
                  ? `${novel.total_chapters} bab`
                  : `${novel.available_chapters} dari ${novel.total_chapters} bab`}
              </span>
            )}
          </div>

          {novel.genres.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {novel.genres.map((g) => (
                <span key={g.slug || g.name} className="chip chip-accent">
                  {g.name}
                </span>
              ))}
            </div>
          )}

          {novel.description && (
            <p className="mt-6 leading-relaxed text-fg/85">{scrubSource(novel.description)}</p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <NovelReadButton slug={novel.novels_slug} availableChapters={novel.available_chapters} />
            <FavoriteButton
              slug={novel.novels_slug}
              title={novel.title}
              cover={novel.cover}
              rating={novel.rating}
              episode_count={novel.episode_count}
            />
          </div>

          <p className="mt-5 font-mono text-xs uppercase tracking-mono text-soft">
            Baca langsung di sini — gratis, tanpa keluar dari DramaKu.
          </p>
        </div>
      </div>

      {/* daftar bab */}
      <Reveal className="mt-14">
        <div className="mx-auto max-w-4xl">
          <div className="head">
            <p className="eyebrow">Daftar Isi</p>
            <h2>Pilih Bab</h2>
          </div>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
            {chapters.map((n) => {
              const playable = n <= novel.available_chapters;
              return (
                <Link
                  key={n}
                  href={`/novels/${novel.novels_slug}/chapter/${n}`}
                  title={playable ? `Bab ${n}` : `Bab ${n} — belum rilis di sumber`}
                  className={`focus-ring flex aspect-square items-center justify-center rounded border font-mono text-xs tracking-mono transition hover:scale-[1.06] ${
                    playable
                      ? 'border-border/[var(--border-alpha)] bg-card text-fg/85 hover:border-accent/60'
                      : 'border-dashed border-border/[var(--border-alpha)] bg-card/40 text-soft/70 hover:border-soft/40'
                  }`}
                >
                  {playable ? (
                    n
                  ) : (
                    <span className="flex flex-col items-center gap-[3px]">
                      <span>{n}</span>
                      <span className="rounded-full border border-soft/50 bg-soft/10 px-[2px] py-[1px] text-[6.5px] leading-none tracking-[0.03em] text-muted sm:px-[3px] sm:text-[8px]">BELUM RILIS</span>
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
          {novel.total_chapters !== null && novel.available_chapters < novel.total_chapters && (
            <p className="mt-3 font-mono text-[11px] uppercase tracking-mono text-soft">
              {novel.available_chapters} dari {novel.total_chapters} bab siap dibaca · sisanya belum rilis
            </p>
          )}
        </div>
      </Reveal>
    </div>
  );
}
