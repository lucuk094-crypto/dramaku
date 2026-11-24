import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import BackButton from '@/components/BackButton';
import DbPlayer from '@/components/DbPlayer';
import { IconChevronLeft, IconPlay } from '@/components/Icons';
import { resolveDbEpisode, resolveDbSources, dbDetail } from '@/lib/dramabox';
import { ogMeta } from '@/lib/og';

export const revalidate = 1800;

interface Props {
  params: { bookId: string };
  searchParams: { ep?: string };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const ep = Math.max(1, Number(searchParams.ep || 1) || 1);
  const d = await dbDetail(params.bookId).catch(() => null);
  return {
    title: d ? `${d.book.title} — Episode ${ep} | DramaKu` : 'Tonton | DramaKu',
    ...(d
      ? ogMeta({
          title: `${d.book.title} — Episode ${ep} di DramaKu`,
          description: d.book.introduction,
          path: `/dramabox/tonton/${params.bookId}?ep=${ep}`,
          image: d.book.cover || null,
        })
      : {}),
  };
}

export default async function DramaboxWatchPage({ params, searchParams }: Props) {
  const ep = Math.max(1, Number(searchParams.ep || 1) || 1);
  const [plan, d] = await Promise.all([
    resolveDbEpisode(params.bookId, ep).catch(() => null),
    dbDetail(params.bookId).catch(() => null),
  ]);
  if (!plan || !d) notFound();

  const b = d.book;
  const total = plan.total;
  const slug = `db-${b.bookId}`;
  const noteText =
    plan.kind === 'preview'
      ? plan.note
      : plan.kind === 'youtube'
        ? 'Sumber gratis ditemukan — diputar dari unggahan resmi.'
        : 'Streaming penuh — semua terbuka, tanpa premium.';

  return (
    <>
      {/* pemutar full-screen ala melolo/TikTok */}
      <section className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[rgb(var(--bg))] md:static md:z-auto md:mx-auto md:mt-8 md:h-[84dvh] md:max-w-5xl">
        {/* bilah melayang atas */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 bg-gradient-to-b from-black/75 via-black/25 to-transparent px-3 pb-12 pt-[calc(env(safe-area-inset-top,0px)+0.65rem)] md:px-4">
          <span className="pointer-events-auto">
            <BackButton />
          </span>
          <p className="rounded-full border border-white/15 bg-black/45 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/85 backdrop-blur-md">
            EP {String(ep).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </p>
          <Link
            href={`/dramabox/judul/${b.bookId}`}
            className="focus-ring pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md transition hover:bg-black/70"
          >
            <IconPlay className="h-3 w-3" /> Detail
          </Link>
        </div>

        {/* panggung video */}
        <div className="relative flex-1">
          <DbPlayer
            fill
            kind={plan.kind}
            url={plan.url}
            videoId={plan.videoId}
            title={`${b.title} — Episode ${ep}`}
            cover={plan.cover || b.cover}
            slug={slug}
            episode={ep}
            episodeCount={total}
          />
        </div>

        {/* kendali episode + catatan sumber melayang */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-between gap-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-12 md:px-4">
          <p className="max-w-[58%] text-[11px] leading-snug text-white/85">{noteText}</p>
          <div className="pointer-events-auto flex flex-col items-end gap-2">
            {ep > 1 && (
              <Link
                href={`/dramabox/tonton/${b.bookId}?ep=${ep - 1}`}
                className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md transition hover:bg-black/70"
              >
                <IconChevronLeft className="h-3.5 w-3.5 rotate-90" /> Ep {ep - 1}
              </Link>
            )}
            {ep < total && (
              <Link
                href={`/dramabox/tonton/${b.bookId}?ep=${ep + 1}`}
                className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md transition hover:bg-black/70"
              >
                <IconChevronLeft className="h-3.5 w-3.5 -rotate-90" /> Ep {ep + 1}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* judul & daftar episode — tampil di desktop; di mobile lewat tombol Detail */}
      <div className="container-x hidden pb-16 pt-6 md:block">
        <div className="mx-auto max-w-5xl">
          <div className="mt-4">
            <p className="eyebrow">Sedang Ditonton</p>
            <h1 className="mt-1 text-2xl font-medium leading-tight tracking-tightest">
              {b.title}
              <span className="text-soft"> · Episode {ep}</span>
            </h1>
            <p className="mt-2 line-clamp-3 text-muted">{b.introduction}</p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {ep > 1 && (
              <Link href={`/dramabox/tonton/${b.bookId}?ep=${ep - 1}`} className="btn btn-ghost btn-sm focus-ring">
                ← Episode {ep - 1}
              </Link>
            )}
            {ep < total && (
              <Link href={`/dramabox/tonton/${b.bookId}?ep=${ep + 1}`} className="btn btn-main btn-sm focus-ring">
                Episode {ep + 1} →
              </Link>
            )}
            <Link href={`/dramabox/judul/${b.bookId}`} className="btn btn-ghost btn-sm focus-ring">
              Detail Judul
            </Link>
          </div>

          {/* daftar episode — mengalir supaya pemutar tidak terblokir */}
          <Suspense
            fallback={
              <aside aria-hidden className="mt-10">
                <p className="eyebrow">Daftar Episode</p>
                <div className="mt-3 grid grid-cols-5 gap-2 opacity-40 lg:grid-cols-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="aspect-square animate-pulse rounded border border-[--border] bg-[--panel]/50" />
                  ))}
                </div>
              </aside>
            }
          >
            <DbEpisodeAside bookId={b.bookId} ep={ep} />
          </Suspense>
        </div>
      </div>
    </>
  );
}

async function DbEpisodeAside({ bookId, ep }: { bookId: string; ep: number }) {
  const res = await resolveDbSources(bookId).catch(() => null);
  if (!res) return null;
  return (
    <aside>
      <p className="eyebrow">Daftar Episode</p>
      <div className="mt-3 grid grid-cols-5 gap-2 lg:grid-cols-6">
        {res.plans.map((p) => {
          const open = p.kind !== 'preview';
          return (
            <Link
              key={p.n}
              href={`/dramabox/tonton/${bookId}?ep=${p.n}`}
              title={open ? `Episode ${p.n}` : `Episode ${p.n} — premium (cuplikan)`}
              className={`focus-ring flex aspect-square flex-col items-center justify-center gap-[2px] rounded border font-mono text-[11px] tracking-mono transition hover:scale-[1.06] ${
                p.n === ep
                  ? 'border-[--accent] bg-[--accent] text-[rgb(var(--btn-text))]'
                  : open
                    ? 'border-[--border] bg-[--panel] text-[--fg]/85 hover:border-[--accent]/60'
                    : 'border-dashed border-[--border] bg-[--panel]/40 text-[--muted]/70'
              }`}
            >
              {open ? (
                p.n
              ) : (
                <>
                  <span>{p.n}</span>
                  <span className="rounded-full border border-[--muted]/50 bg-[--muted]/10 px-[2px] py-[1px] text-[6px] leading-none tracking-[0.03em] text-[--muted]">
                    PREMIUM
                  </span>
                </>
              )}
            </Link>
          );
        })}
      </div>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-mono text-soft">
        {res.openCount} dari {res.total} terbuka · sisanya premium di sumber resmi
      </p>
    </aside>
  );
}
