import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getRsBook, rsBookUrl } from '@/lib/reelshort';
import { bridgeToMelolo } from '@/lib/flickreels';
import Reveal from '@/components/Reveal';
import { IconPlay } from '@/components/Icons';

export const revalidate = 1800;

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await getRsBook(params.id).catch(() => null);
  return {
    title: d ? `${d.title} | DramaKu` : 'Detail Judul | DramaKu',
    description: d?.desc?.slice(0, 150) || 'Detail judul, sinopsis, dan daftar episode lengkap.',
  };
}

function fmtDate(ts: number): string {
  if (!ts) return '-';
  return new Date(ts * 1000).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default async function ReelShortJudulPage({ params }: Props) {
  const d = await getRsBook(params.id).catch(() => null);
  if (!d) notFound();

  const bridge = await bridgeToMelolo(d.title).catch(() => null);
  const tags = [...new Set([...d.tags, ...d.tagNames])].slice(0, 6);

  return (
    <div className="container-x pb-16 pt-4">
      <Reveal>
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="panel relative w-full max-w-[240px] shrink-0 overflow-hidden">
            {d.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.cover} alt={d.title} className="aspect-[3/4] w-full object-cover" />
            ) : (
              <div className="flex aspect-[3/4] w-full items-center justify-center bg-accent-bg text-4xl font-black text-accent/50">
                {(d.title || '?')[0]}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="eyebrow">Detail Judul</p>
            <h1 className="mt-2 text-3xl font-medium leading-tight tracking-tightest">{d.title}</h1>

            <p className="mt-3 font-mono text-xs uppercase tracking-mono text-soft">
              {d.total} Episode · {d.readCount.toLocaleString('id-ID')}x ditonton ·{' '}
              {d.collectCount.toLocaleString('id-ID')} koleksi
              {d.isAi ? ' · Dubbing AI' : ''}
              {d.isDub ? ' · Dubbing' : ''}
            </p>

            {tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-sm border border-border bg-card px-2 py-0.5 font-mono text-[10px] uppercase tracking-mono text-muted"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 font-serif text-lg italic leading-snug tracking-wide text-muted">
              <p>{d.desc || 'Sinopsis belum tersedia untuk judul ini.'}</p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2">
              <Link href={`/reelshort/tonton/${d.id}?ep=1`} className="btn btn-main focus-ring">
                <IconPlay className="h-4 w-4" />
                Tonton Episode 1
              </Link>
              {bridge && (
                <Link href={`/series/${bridge.slug}`} className="btn btn-ghost focus-ring">
                  Tonton Versi Lengkap
                </Link>
              )}
              <Link href="/jelajah" className="btn btn-ghost focus-ring">
                Kembali
              </Link>
            </div>

            <p className="mt-3 text-sm text-muted">
              {bridge
                ? 'Judul ini juga tersedia di katalog tonton kami — semua episode terbuka. '
                : 'Semua episode bisa diputar langsung di web ini. '}
              <a
                href={rsBookUrl(d.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline-offset-4 hover:underline"
              >
                Lihat di Situs Resmi ↗
              </a>
            </p>
          </div>
        </div>
      </Reveal>

      {/* DAFTAR EPISODE */}
      <Reveal className="mt-12">
        <div className="head">
          <p className="eyebrow">Episode</p>
          <h2>Daftar Episode ({d.episodes.length}) — Terbuka Semua</h2>
        </div>

        {d.episodes.length > 0 ? (
          <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
            {d.episodes.map((ep) => (
              <Link
                key={ep.chapterId}
                href={`/reelshort/tonton/${d.id}?ep=${ep.serial}`}
                title={`Episode ${ep.serial}${ep.publishAt ? ` · ${fmtDate(ep.publishAt)}` : ''}`}
                className="focus-ring flex aspect-square items-center justify-center rounded border border-[--border] bg-[--panel] font-mono text-xs tracking-mono transition hover:scale-[1.06] hover:border-[--accent]/60"
              >
                {ep.serial}
              </Link>
            ))}
          </div>
        ) : (
          <div className="panel pad text-center">
            <p className="mono text-soft">Belum ada judul</p>
            <p className="mt-3 text-muted">Daftar episode belum tersedia.</p>
          </div>
        )}
      </Reveal>
    </div>
  );
}
