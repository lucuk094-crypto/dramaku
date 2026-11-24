import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import BackButton from '@/components/BackButton';
import DbPlayer from '@/components/DbPlayer';
import { resolveDbEpisode, resolveDbSources } from '@/lib/dramabox';

export const revalidate = 1800;

interface Props {
  params: { bookId: string };
  searchParams: { ep?: string };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const ep = Math.max(1, Number(searchParams.ep || 1) || 1);
  const r = await resolveDbSources(params.bookId).catch(() => null);
  return {
    title: r ? `${r.detail.book.title} — Episode ${ep} | DramaKu` : 'Tonton | DramaKu',
  };
}

export default async function DramaboxWatchPage({ params, searchParams }: Props) {
  const ep = Math.max(1, Number(searchParams.ep || 1) || 1);
  const [plan, res] = await Promise.all([
    resolveDbEpisode(params.bookId, ep).catch(() => null),
    resolveDbSources(params.bookId).catch(() => null),
  ]);
  if (!plan || !res) notFound();

  const b = res.detail.book;
  const slug = `db-${b.bookId}`;
  const noteText =
    plan.kind === 'preview'
      ? plan.note
      : plan.kind === 'youtube'
        ? 'Sumber gratis ditemukan — diputar dari unggahan resmi.'
        : 'Streaming penuh — semua terbuka, tanpa premium.';

  return (
    <div className="container-x pb-16 pt-4">
      <div className="flex items-center justify-between gap-3">
        <BackButton />
        <p className="font-mono text-[11px] uppercase tracking-mono text-soft">
          Episode {ep} dari {res.total}
        </p>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <DbPlayer
            kind={plan.kind}
            url={plan.url}
            videoId={plan.videoId}
            title={`${b.title} — Episode ${ep}`}
            cover={plan.cover || b.cover}
            slug={slug}
            episode={ep}
            episodeCount={res.total}
            note={noteText}
          />

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
            {ep < res.total && (
              <Link href={`/dramabox/tonton/${b.bookId}?ep=${ep + 1}`} className="btn btn-main btn-sm focus-ring">
                Episode {ep + 1} →
              </Link>
            )}
            <Link href={`/dramabox/judul/${b.bookId}`} className="btn btn-ghost btn-sm focus-ring">
              Detail Judul
            </Link>
          </div>
        </div>

        {/* daftar episode */}
        <aside>
          <p className="eyebrow">Daftar Episode</p>
          <div className="mt-3 grid grid-cols-5 gap-2 lg:grid-cols-6">
            {res.plans.map((p) => {
              const open = p.kind !== 'preview';
              return (
                <Link
                  key={p.n}
                  href={`/dramabox/tonton/${b.bookId}?ep=${p.n}`}
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
      </div>
    </div>
  );
}
