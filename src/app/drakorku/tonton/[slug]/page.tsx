import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { dkSeriesBySlug } from '@/lib/drakorku';
import DkEpisodeFeed from '@/components/DkEpisodeFeed';

export const revalidate = 1800;

interface Props {
  params: { slug: string };
  searchParams: { ep?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = await dkSeriesBySlug(params.slug).catch(() => null);
  return {
    title: s ? `Nonton ${s.name} — Episode Lengkap | DramaKu` : 'Nonton Drama Asia | DramaKu',
    description: s?.synopsis?.slice(0, 150) || 'Nonton drakor dan drama Asia episode lengkap di DramaKu.',
  };
}

export default async function DrakorkuTontonPage({ params, searchParams }: Props) {
  const s = await dkSeriesBySlug(params.slug).catch(() => null);
  if (!s || s.episodes.length === 0) notFound();

  const total = s.episodes.length;
  const epReq = Math.max(1, Math.min(total, Number.parseInt(searchParams.ep || '1', 10) || 1));
  const episodes = [...s.episodes].sort((a, b) => a.n - b.n);

  return (
    <div className="container-x pb-16 pt-4">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/drakorku/serial/${s.slug}`} className="btn btn-ghost focus-ring">
          ← Detail & Episode
        </Link>
        <a
          href={`/drakorku/tonton/${s.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost focus-ring"
          title="Buka di tab terpisah bila video tidak bergerak di pratinjau"
        >
          ↗ Tab Baru
        </a>
        <p className="mono truncate text-xs uppercase tracking-mono text-soft">
          {s.name} · {Math.max(s.total, total)} episode · yang sudah rilis terbuka semua
        </p>
      </div>

      <div className="mt-3">
        <DkEpisodeFeed
          slug={s.slug}
          title={s.name}
          cover={s.cover}
          episodes={episodes.map((e) => ({ n: e.n, src: e.src, pic: e.pic }))}
          startEp={epReq}
        />
      </div>

      {/* grid semua episode — semua terbuka */}
      <div className="mt-8">
        <p className="eyebrow">Daftar Episode</p>
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
          {Array.from({ length: Math.max(s.total, episodes[episodes.length - 1]?.n || 0) }, (_, i) => i + 1).map((n) => {
            const has = episodes.some((e) => e.n === n);
            if (!has) {
              return (
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
            }
            return (
              <Link
                key={n}
                href={`/drakorku/tonton/${s.slug}?ep=${n}`}
                title={`Episode ${n}`}
                className={`focus-ring flex aspect-square items-center justify-center rounded border font-mono text-xs tracking-mono transition hover:scale-[1.06] ${
                  n === epReq
                    ? 'border-[--accent] bg-[--accent] text-[--accent-bg]'
                    : 'border-[--border] bg-[--panel] hover:border-[--accent]/60'
                }`}
              >
                {n}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
