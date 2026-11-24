import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getRsBook, rsBookUrl } from '@/lib/reelshort';
import { ogMeta } from '@/lib/og';
import { bridgeToMelolo } from '@/lib/flickreels';
import Reveal from '@/components/Reveal';
import RsEpisodeFeed from '@/components/RsEpisodeFeed';
import { IconPlay } from '@/components/Icons';

export const revalidate = 1800;

interface Props {
  params: { bookId: string };
  searchParams: { ep?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await getRsBook(params.bookId).catch(() => null);
  return {
    title: d ? `Nonton ${d.title} — Episode Lengkap | DramaKu` : 'Nonton Episode Lengkap | DramaKu',
    ...ogMeta({
      title: d ? `${d.title} — Nonton di DramaKu` : 'Nonton Episode Lengkap — DramaKu',
      description: d?.desc,
      path: `/reelshort/tonton/${params.bookId}`,
      image: d?.cover || null,
    }),
  };
}

export default async function ReelShortTontonPage({ params, searchParams }: Props) {
  const d = await getRsBook(params.bookId).catch(() => null);
  if (!d || d.episodes.length === 0) notFound();

  const total = d.episodes.length;
  const epReq = Math.max(1, Math.min(total, Number.parseInt(searchParams.ep || '1', 10) || 1));
  const current = d.episodes.find((e) => e.serial === epReq) || d.episodes[0];
  const bridge = await bridgeToMelolo(d.title).catch(() => null);

  // urutkan naik berdasarkan nomor episode (jaminan 1..N lengkap)
  const episodes = [...d.episodes].sort((a, b) => a.serial - b.serial);

  return (
    <div className="container-x pb-16 pt-4">
      {/* baris atas: kembali + info singkat */}
      <div className="flex items-center justify-between gap-3">
        <Link href={`/reelshort/judul/${d.id}`} className="btn btn-ghost focus-ring">
          ← Detail & Episode
        </Link>
        <a
          href={`/reelshort/tonton/${d.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost focus-ring"
          title="Buka di tab terpisah bila video tidak bergerak di pratinjau"
        >
          ↗ Tab Baru
        </a>
        <p className="mono truncate text-xs uppercase tracking-mono text-soft">
          {d.title} · {total} episode · semua terbuka
        </p>
      </div>

      {/* FEED PEMUTAR */}
      <div className="mt-3">
        <RsEpisodeFeed
          bookId={d.id}
          title={d.title}
          cover={d.cover}
          episodeCount={total}
          episodes={episodes.map((e) => ({ chapterId: e.chapterId, serial: e.serial, pic: e.pic }))}
          startEp={current.serial}
        />
      </div>

      {/* info seri */}
      <Reveal className="mt-8">
        <div className="head">
          <p className="eyebrow">Sedang Ditonton</p>
          <h2 className="text-2xl tracking-tightest">
            {d.title} — Episode {current.serial}
          </h2>
          <div className="head-side">
            <p className="mono text-soft">
              {d.readCount.toLocaleString('id-ID')}x ditonton · sumber: reelshort.com
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {bridge ? (
            <Link href={`/watch/${bridge.slug}/${current.serial}`} className="btn btn-main focus-ring">
              <IconPlay className="h-4 w-4" />
              Tonton Versi Lengkap
            </Link>
          ) : null}
          <a
            href={rsBookUrl(d.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost focus-ring"
          >
            Tonton di Situs Resmi ↗
          </a>
          <Link href={`/reelshort/judul/${d.id}`} className="btn btn-ghost focus-ring">
            Sinopsis Lengkap
          </Link>
        </div>
        <p className="mt-4 max-w-3xl leading-relaxed text-muted">
          {d.desc.slice(0, 260)}
          {d.desc.length > 260 ? '…' : ''}
        </p>
      </Reveal>

      {/* SEMUA EPISODE — lengkap 1..N, semuanya terbuka */}
      <Reveal className="mt-10">
        <div className="head">
          <p className="eyebrow">Episode</p>
          <h2>Semua Episode ({total}) — Terbuka Semua</h2>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
          {episodes.map((ep) => {
            const isCurrent = ep.serial === current.serial;
            return (
              <Link
                key={ep.chapterId}
                href={`/reelshort/tonton/${d.id}?ep=${ep.serial}`}
                title={`Episode ${ep.serial}`}
                className={`focus-ring flex aspect-square items-center justify-center rounded border font-mono text-xs tracking-mono transition hover:scale-[1.06] ${
                  isCurrent
                    ? 'border-accent bg-accent text-[rgb(var(--btn-text))]'
                    : 'border-border/[var(--border-alpha)] bg-card hover:border-accent/60'
                }`}
              >
                {ep.serial}
              </Link>
            );
          })}
        </div>
      </Reveal>
    </div>
  );
}
