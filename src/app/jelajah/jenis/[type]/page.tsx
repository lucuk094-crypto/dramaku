import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getNewSeries, search, type MediaCard, normTitle } from '@/lib/melolo';
import { getFrPlaylets, bridgeMany, type FrPlaylet } from '@/lib/flickreels';
import { getRsAllBooks, getRsNewRelease, type RsBook } from '@/lib/reelshort';
import { JENIS } from '@/lib/taxonomy';
import MediaCardEl from '@/components/MediaCard';
import FrCard from '@/components/FrCard';
import RsCard from '@/components/RsCard';
import CarouselRow from '@/components/CarouselRow';
import DkSection from '@/components/DkSection';
import Reveal from '@/components/Reveal';

export const revalidate = 1800;

interface Props {
  params: { type: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const j = JENIS.find((x) => x.type === params.type);
  return {
    title: j ? `Jenis ${j.name} | Jelajah DramaKu` : 'Jenis | Jelajah DramaKu',
    description: j?.desc,
  };
}

export default async function JenisPage({ params }: Props) {
  const type = params.type;
  const j = JENIS.find((x) => x.type === type);
  if (!j) notFound();

  /* ---------------- Drama: katalog utama (genre + terbaru) */
  if (type === 'drama') {
    const [news, all] = await Promise.all([
      getNewSeries(12).catch(() => []),
      getFrPlaylets(0, 1, 12).catch(() => null),
    ]);
    // anti-dobel: rail Baru Tayang menang; katalog menyusul
    const newsKeys = new Set(news.map((n) => normTitle(n.title)));
    const frItems = all ? all.items.filter((x) => !newsKeys.has(normTitle(x.title))).slice(0, 12) : [];
    const bridges = frItems.length ? await bridgeMany(frItems.map((x) => x.title)) : new Map();
    return (
      <div className="container-x pb-16 pt-4">
        <JenisHead j={j} />

        <Reveal className="mt-8">
          <IndeksPanel />
        </Reveal>

        {news.length > 0 && (
          <Reveal className="mt-10">
            <div className="head">
              <p className="eyebrow">Baru Tayang</p>
              <h2 className="text-2xl tracking-tightest">Rilisan Terbaru (2026 →)</h2>
            </div>
            <div className="mt-2">
              <CarouselRow>
                {news.map((n, i) => (
                  <MediaCardEl key={n.slug} item={toMediaCard(n)} index={i} />
                ))}
              </CarouselRow>
            </div>
          </Reveal>
        )}

        {frItems.length > 0 && (
          <Reveal className="mt-10">
            <div className="head">
              <p className="eyebrow">Katalog Terbaru</p>
              <h2 className="text-2xl tracking-tightest">Pilihan Terbaru</h2>
            </div>
            <div className="mt-2">
              <CarouselRow>
                {frItems.map((p: FrPlaylet, i: number) => (
                  <FrCard key={p.playlet_id} item={p} meloloSlug={bridges.get(p.title)?.slug ?? null} index={i} />
                ))}
              </CarouselRow>
            </div>
          </Reveal>
        )}
      </div>
    );
  }

  /* ---------------- AI: judul dubbing-AI sungguhan + katalog live */
  if (type === 'ai') {
    const [aiBooks, results] = await Promise.all([
      Promise.all([getRsAllBooks(1).catch(() => ({ items: [] as RsBook[] })), getRsAllBooks(2).catch(() => ({ items: [] as RsBook[] }))]),
      search('AI', 'series', 1, 12).catch(() => null),
    ]);
    const seen = new Set<string>();
    const aiItems = aiBooks
      .flatMap((p) => p.items)
      .filter((b) => b.isAi && !seen.has(b.title) && seen.add(b.title))
      .slice(0, 18);
    return (
      <div className="container-x pb-16 pt-4">
        <JenisHead j={j} />
        <Reveal className="mt-8">
          <div className="panel p-6">
            <p className="eyebrow">Zona Drama AI</p>
            <p className="mt-2 max-w-2xl leading-relaxed text-muted">
              Kumpulan drama pendek dengan teknologi dubbing &amp; produksi AI — koleksinya terus bertambah
              dan diperbarui otomatis secara real-time.
            </p>
          </div>
        </Reveal>

        {aiItems.length > 0 && (
          <Reveal className="mt-8">
            <div className="head">
              <p className="eyebrow">Dubbing AI</p>
              <h2 className="text-2xl tracking-tightest">Drama dengan Teknologi AI</h2>
            </div>
            <div className="mt-2">
              <CarouselRow>
                {aiItems.map((b, i) => (
                  <RsCard key={b.id} item={b} meloloSlug={null} index={i} />
                ))}
              </CarouselRow>
            </div>
          </Reveal>
        )}

        {results && results.items.length > 0 && (
          <Reveal className="mt-8">
            <div className="head">
              <p className="eyebrow">Live</p>
              <h2 className="text-2xl tracking-tightest">Judul Bertema AI</h2>
            </div>
            <div className="mt-2">
              <CarouselRow>
                {results.items.map((item, i) => (
                  <MediaCardEl key={item.slug} item={item} index={i} />
                ))}
              </CarouselRow>
            </div>
          </Reveal>
        )}

        <Reveal className="mt-8">
          <IndeksPanel />
        </Reveal>
      </div>
    );
  }

  /* ---------------- Anime: katalog animasi — sumber nyata + pantauan live */
  const news = await getNewSeries(12).catch(() => []);
  return (
    <div className="container-x pb-16 pt-4">
      <JenisHead j={j} />
      <Reveal className="mt-8">
        <div className="panel p-6">
          <p className="eyebrow">Anime &amp; Animasi</p>
          <p className="mt-2 max-w-2xl leading-relaxed text-muted">
            Katalog anime/animasi dikumpulkan dari seluruh sumber yang tersedia dan diperbarui otomatis.
            Sementara koleksinya bertambah, jelajahi pilihan fantasi &amp; petualangan di bawah ini.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/drakorku/kategori/fantasy" className="btn btn-main btn-sm focus-ring">
              Fantasi
            </Link>
            <Link href="/drakorku/kategori/adventure" className="btn btn-ghost btn-sm focus-ring">
              Petualangan
            </Link>
            <Link href="/baru-tayang" className="btn btn-ghost btn-sm focus-ring">
              Baru Tayang
            </Link>
          </div>
        </div>
      </Reveal>

      <DkSection query="Fantasy" title="Pilihan Fantasi &amp; Petualangan" eyebrow="Koleksi Pilihan" className="mt-10" />
      <DkSection query="Adventure" title="Petualangan Seru" eyebrow="Koleksi Pilihan" className="mt-10" />

      {news.length > 0 && (
        <Reveal className="mt-10">
          <div className="head">
            <p className="eyebrow">Baru Tayang</p>
            <h2 className="text-2xl tracking-tightest">Rilisan Terbaru</h2>
          </div>
          <div className="mt-2">
            <CarouselRow>
              {news.map((n, i) => (
                <MediaCardEl key={n.slug} item={toMediaCard(n)} index={i} />
              ))}
            </CarouselRow>
          </div>
        </Reveal>
      )}
    </div>
  );
}

function IndeksPanel() {
  return (
    <div>
      <div className="head">
        <p className="eyebrow">Indeks Lengkap</p>
        <h2 className="text-2xl tracking-tightest">Genre, Kategori &amp; Karakter</h2>
        <div className="head-side">
          <p className="mono text-soft">
            <a href="/genres" className="go focus-ring rounded">
              Buka Indeks
            </a>
          </p>
        </div>
      </div>
      <div className="mt-4">
        <a href="/genres" className="panel focus-ring group flex items-center justify-between gap-3 p-5 transition hover:scale-[1.01] hover:border-accent/50">
          <div>
            <p className="font-medium tracking-tight transition-colors group-hover:text-accent">
              Semua pilihan genre &amp; kategori ada di satu halaman
            </p>
            <p className="mt-1 text-sm text-muted">Genre, 42 kategori, karakter favorit, dan genre drama Asia — urut dan lengkap.</p>
          </div>
          <span className="go" aria-hidden />
        </a>
      </div>
    </div>
  );
}

function toMediaCard(n: {
  slug: string;
  title: string | null;
  cover: string | null;
  rating: string | null;
  episode_count: number | null;
  description: string | null;
  genres: { slug: string | null; name: string }[];
  updated: string | null;
}): MediaCard {
  return {
    type: 'series',
    slug: n.slug,
    title: n.title,
    cover: n.cover,
    rating: n.rating,
    rank: null,
    episode_count: n.episode_count,
    description: n.description,
    genres: n.genres,
    publish_date: n.updated,
    url: `/series/${n.slug}`,
  };
}

function JenisHead({ j }: { j: (typeof JENIS)[number] }) {
  return (
    <Reveal>
      <div className="head">
        <p className="eyebrow">Jenis</p>
        <h1 className="text-3xl font-medium tracking-tightest">{j.name}</h1>
        <p className="mt-2 max-w-2xl leading-relaxed text-muted">{j.desc}</p>
        <div className="mt-3 flex gap-2">
          {JENIS.map((x) => (
            <Link
              key={x.type}
              href={`/jelajah/jenis/${x.type}`}
              className={`focus-ring rounded border px-3 py-1.5 text-sm tracking-tight transition ${
                x.type === j.type
                  ? 'border-accent bg-accent text-[rgb(var(--btn-text))]'
                  : 'border-border/[var(--border-alpha)] bg-card text-fg/85 hover:border-accent/60'
              }`}
            >
              {x.name}
            </Link>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
