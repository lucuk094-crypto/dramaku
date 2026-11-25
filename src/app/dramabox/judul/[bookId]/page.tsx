import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Reveal from '@/components/Reveal';
import FavoriteButton from '@/components/FavoriteButton';
import { IconPlay } from '@/components/Icons';
import { resolveDbSources } from '@/lib/dramabox';
import { ogMeta } from '@/lib/og';

export const revalidate = 3600;

interface Props {
  params: { bookId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await resolveDbSources(params.bookId).catch(() => null);
  return {
    title: r ? `${r.detail.book.title} | DramaKu` : 'Detail Judul | DramaKu',
    ...ogMeta({
      title: r ? `${r.detail.book.title} — Nonton di DramaKu` : 'Detail Judul — DramaKu',
      description: r?.detail.book.introduction,
      path: `/dramabox/judul/${params.bookId}`,
      image: r?.detail.book.cover || null,
    }),
  };
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} rb`;
  return String(n);
}

export default async function DramaboxDetailPage({ params }: Props) {
  const r = await resolveDbSources(params.bookId).catch(() => null);
  if (!r) notFound();

  const b = r.detail.book;
  const tags = [...new Set([...(b.genres || []), ...(b.tags || [])])].slice(0, 6);
  const firstOpen = r.plans.find((p) => p.kind !== 'preview');

  return (
    <div className="container-x pb-16 pt-4">
      <Reveal>
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="panel relative w-full max-w-[240px] shrink-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.cover} alt={b.title} className="aspect-[3/4] w-full object-cover" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="eyebrow">Detail Judul</p>
            <h1 className="mt-2 text-3xl font-medium leading-tight tracking-tightest">{b.title}</h1>

            <p className="mt-3 font-mono text-xs uppercase tracking-mono text-soft">
              {r.total} Episode · {r.openCount} terbuka · {fmt(b.viewCount || 0)}x ditonton
              {b.rating ? ` · ★ ${Number(b.rating).toFixed(1)}` : ''}
            </p>

            {tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-sm border border-[--border] bg-[--panel] px-2 py-0.5 font-mono text-[10px] uppercase tracking-mono text-[--muted]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 font-serif text-lg italic leading-snug tracking-wide text-muted">
              <p>{b.introduction || 'Sinopsis belum tersedia untuk judul ini.'}</p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2">
              {firstOpen && (
                <Link href={`/dramabox/tonton/${b.bookId}?ep=${firstOpen.n}`} className="btn btn-main focus-ring">
                  <IconPlay className="h-4 w-4" />
                  Tonton Episode {firstOpen.n}
                </Link>
              )}
              <FavoriteButton
                slug={`db-${b.bookId}`}
                title={b.title}
                cover={b.cover}
                rating={b.rating ? String(b.rating) : null}
                episode_count={r.total}
                type="dramabox"
                className="btn btn-ghost focus-ring"
              />
              {r.meloloSlug && (
                <Link href={`/series/${r.meloloSlug}`} className="btn btn-ghost focus-ring">
                  Tonton Versi Lengkap
                </Link>
              )}
              <Link href="/dramabox" className="btn btn-ghost focus-ring">
                Kembali
              </Link>
            </div>

            <p className="mt-3 text-sm text-muted">
              {r.openCount >= r.total
                ? 'Semua episode terbuka dan bisa diputar langsung di web ini.'
                : `${r.openCount} dari ${r.total} episode terbuka dan bisa diputar langsung — sisanya premium di sumber resmi.`}
            </p>
          </div>
        </div>
      </Reveal>

      {/* grid episode — semua sumber, all unlock */}
      <Reveal className="mt-12">
        <div className="head">
          <p className="eyebrow">Episode</p>
          <h2>
            Daftar Episode ({r.total}) — {r.openCount} Terbuka
          </h2>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
          {r.plans.map((p) => {
            const open = p.kind !== 'preview';
            return (
              <Link
                key={p.n}
                href={`/dramabox/tonton/${b.bookId}?ep=${p.n}`}
                title={
                  open
                    ? `Episode ${p.n}`
                    : `Episode ${p.n} — premium di sumber resmi (cuplikan bila tersedia)`
                }
                className={`focus-ring flex aspect-square flex-col items-center justify-center gap-[3px] rounded border font-mono text-xs tracking-mono transition hover:scale-[1.06] ${
                  open
                    ? 'border-[--border] bg-[--panel] text-[--fg]/85 hover:border-[--accent]/60'
                    : 'border-dashed border-[--border] bg-[--panel]/40 text-[--muted]/70 hover:border-[--muted]/40'
                }`}
              >
                {open ? (
                  p.n
                ) : (
                  <>
                    <span>{p.n}</span>
                    <span className="rounded-full border border-[--muted]/50 bg-[--muted]/10 px-[2px] py-[1px] text-[6.5px] leading-none tracking-[0.03em] text-[--muted] sm:px-[3px] sm:text-[8px]">
                      PREMIUM
                    </span>
                  </>
                )}
              </Link>
            );
          })}
        </div>

        {r.openCount < r.total && (
          <p className="mt-3 font-mono text-[11px] uppercase tracking-mono text-soft">
            {r.openCount} dari {r.total} episode terbuka dari berbagai sumber gratis · sisanya premium —
            klik untuk cuplikan bila tersedia
          </p>
        )}
      </Reveal>
    </div>
  );
}
