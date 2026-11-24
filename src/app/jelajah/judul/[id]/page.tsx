import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getFrDetail, bridgeToMelolo } from '@/lib/flickreels';
import Reveal from '@/components/Reveal';

export const revalidate = 1800;

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return { title: 'Judul | DramaKu' };
  const d = await getFrDetail(id).catch(() => null);
  return {
    title: d ? `${d.title} | Jelajah DramaKu` : 'Judul | Jelajah DramaKu',
    description: d?.introduce?.slice(0, 150) || 'Detail judul dari katalog platform.',
  };
}

export default async function JudulPage({ params }: Props) {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const d = await getFrDetail(id).catch(() => null);
  if (!d) notFound();

  const bridge = await bridgeToMelolo(d.title);
  const total = d.chapters.length || d.upload_num || 0;
  const freeCount = d.chapters.filter((c) => !c.is_lock).length;

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
            <p className="eyebrow">Detail · Katalog Platform</p>
            <h1 className="mt-1 text-3xl font-medium leading-tight tracking-tightest">{d.title}</h1>
            <p className="mt-2 font-mono text-xs uppercase tracking-mono text-soft">
              {total} Episode
              {d.upload_date ? ` · update ${d.upload_date.slice(0, 10)}` : ''}
              {d.finish_state === 2 ? ' · tamat' : ' · berlangsung'}
            </p>

            {d.tag_name.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {d.tag_name.map((t) => (
                  <Link
                    key={t.id}
                    href={`/jelajah/kategori/${t.id}`}
                    className="focus-ring rounded border border-border/[var(--border-alpha)] bg-card px-2.5 py-1 text-xs tracking-tight text-muted transition hover:border-accent/60 hover:text-fg"
                  >
                    {t.name.trim()}
                  </Link>
                ))}
              </div>
            )}

            {d.introduce && (
              <p className="mt-4 max-w-2xl leading-relaxed text-muted">{d.introduce}</p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {bridge ? (
                <Link href={`/series/${bridge.slug}`} className="btn btn-main focus-ring">
                  ▶ Tonton di DramaKu
                </Link>
              ) : (
                <>
                  <span className="btn btn-ghost focus-ring cursor-not-allowed opacity-60" aria-disabled="true">
                    Segera hadir untuk diputar di DramaKu
                  </span>
                  <Link
                    href={`/search?q=${encodeURIComponent(d.title)}`}
                    className="btn btn-ghost focus-ring"
                  >
                    Cari judul serupa
                  </Link>
                  <Link
                    href="/baru-tayang"
                    className="btn btn-ghost focus-ring"
                  >
                    Baru Tayang →
                  </Link>
                </>
              )}
            </div>
            {!bridge && (
              <p className="mt-3 max-w-xl font-mono text-[11px] uppercase tracking-mono text-soft">
                Judul ini bagian dari katalog platform (jenis/kategori/karakter) — episode lengkapnya terdaftar
                di bawah. Nantikan masuk katalog tonton DramaKu.
              </p>
            )}
          </div>
        </div>
      </Reveal>

      {/* nomor episode LENGKAP 1..N */}
      <Reveal className="mt-12">
        <div className="head">
          <p className="eyebrow">Daftar Episode</p>
          <h2 className="text-2xl tracking-tightest">Episode 1–{total}</h2>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
          {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
            const ch = d.chapters.find((c) => c.chapter_num === n);
            const playable = !!ch && !ch.is_lock;
            return (
              <div
                key={n}
                title={playable ? `Episode ${n}` : `Episode ${n} — belum rilis di sumber`}
                className={`flex aspect-square items-center justify-center rounded border font-mono text-xs tracking-mono ${
                  playable
                    ? 'border-border/[var(--border-alpha)] bg-card text-fg/85'
                    : 'border-dashed border-border/[var(--border-alpha)] bg-card/40 text-soft/70'
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
              </div>
            );
          })}
        </div>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-mono text-soft">
          {total} episode terdaftar · {freeCount} bebas akses di platform sumber · sisanya belum rilis di sumber
        </p>
      </Reveal>
    </div>
  );
}
