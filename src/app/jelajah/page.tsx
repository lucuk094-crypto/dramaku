import Link from 'next/link';
import type { Metadata } from 'next';
import { getNewSeries, type MediaCard, normTitle } from '@/lib/melolo';
import { getFrCategories, getFrPlaylets, bridgeMany, type FrPlaylet } from '@/lib/flickreels';
import { KATEGORI_UTAMA, KARAKTER_UTAMA, JENIS, type TaxItem } from '@/lib/taxonomy';
import MediaCardEl from '@/components/MediaCard';
import FrCard from '@/components/FrCard';
import RsCard from '@/components/RsCard';
import CarouselRow from '@/components/CarouselRow';
import { getRsNewRelease } from '@/lib/reelshort';
import { DK_CATEGORIES, slugify } from '@/lib/drakorku';
import DkSection from '@/components/DkSection';
import DbSection from '@/components/DbSection';
import Reveal from '@/components/Reveal';

export const dynamic = 'force-dynamic'; // render saat runtime — build bebas tarik data hulu

export const metadata: Metadata = {
  title: 'Jelajah — Kategori, Karakter & Baru Tayang | DramaKu',
  description:
    'Jelajah lengkap katalog drama pendek: Kategori, Karakter, Genre, dan Baru Tayang real-time — diperbarui otomatis.',
};

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

function Chip({ item }: { item: TaxItem }) {
  const href = item.tagId != null ? `/jelajah/kategori/${item.tagId}` : `/jelajah/cari?kata=${encodeURIComponent(item.q || item.name)}`;
  return (
    <Link
      href={href}
      className="focus-ring rounded border border-border/[var(--border-alpha)] bg-card px-3 py-1.5 text-sm tracking-tight text-fg/85 transition hover:scale-[1.04] hover:border-accent/60 hover:text-fg"
    >
      {item.name}
    </Link>
  );
}

export default async function JelajahPage() {
  const [news, categories] = await Promise.all([
    getNewSeries(12).catch(() => []),
    getFrCategories().catch(() => []),
  ]);

  // rail "Terbaru per Kategori" — 8 judul teratas katalog umum (live),
  // buang yang kembar dengan rail Baru Tayang (anti-dobel)
  const all = await getFrPlaylets(0, 1, 18).catch(() => null);
  const newsKeys = new Set(news.map((n) => normTitle(n.title)));
  const frItems = all ? all.items.filter((x) => !newsKeys.has(normTitle(x.title))).slice(0, 18) : [];
  const bridges = frItems.length ? await bridgeMany(frItems.map((x) => x.title)) : new Map<string, { slug: string; name: string }>();

  // rail "Rilisan Baru" — katalog global (anti-dobel dengan rail di atas)
  const rsPage = await getRsNewRelease(1).catch(() => null);
  const usedTitles = new Set<string>([...newsKeys, ...frItems.map((x) => normTitle(x.title))]);
  const rsItems = (rsPage?.items || [])
    .filter((b) => !usedTitles.has(normTitle(b.title)))
    .slice(0, 18);
  const rsBridges = rsItems.length
    ? await bridgeMany(rsItems.map((b) => b.title)).catch(() => new Map<string, { slug: string; name: string }>())
    : new Map<string, { slug: string; name: string }>();

  const usedIds = new Set<number | null>([
    ...KATEGORI_UTAMA.map((k) => k.tagId),
    ...KARAKTER_UTAMA.map((k) => k.tagId),
  ]);
  const otherCats = categories.filter((c) => !usedIds.has(c.tag_id));

  return (
    <div className="container-x pb-16 pt-4">
      <Reveal>
        <div className="head">
          <p className="eyebrow">Jelajah</p>
          <h1 className="text-3xl font-medium tracking-tightest">Kategori, Karakter & Baru Tayang</h1>
          <p className="mt-2 max-w-2xl leading-relaxed text-muted">
            Katalog lengkap — diperbarui otomatis (real-time), dari rilisan terbaru 2026 sampai koleksi tahun-tahun sebelumnya.
          </p>
        </div>
      </Reveal>

      {/* BARU TAYANG */}
      <Reveal className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div className="head">
            <p className="eyebrow">Baru Tayang</p>
            <h2 className="text-2xl tracking-tightest">Rilisan & Pembaruan Terbaru</h2>
          </div>
          <Link href="/baru-tayang" className="btn btn-ghost btn-sm focus-ring">
            Semua →
          </Link>
        </div>
        {news.length > 0 ? (
          <div className="mt-2">
            <CarouselRow>
              {news.map((n, i) => (
                <MediaCardEl key={n.slug} item={toMediaCard(n)} index={i} />
              ))}
            </CarouselRow>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">Muat ulang beberapa saat lagi — data sedang mengikuti sumber.</p>
        )}
      </Reveal>

      {/* PILIHAN POPULER — katalog global */}
      {rsItems.length > 0 && (
        <Reveal className="mt-12">
          <div className="head">
            <p className="eyebrow">Koleksi Drama Global</p>
            <h2 className="text-2xl tracking-tightest">Rilisan Baru</h2>
            <div className="head-side">
              <p className="mono text-soft">
                <a href="/reelshort" className="go focus-ring rounded">
                  Semua
                </a>
              </p>
            </div>
          </div>
          <div className="mt-2">
            <CarouselRow>
              {rsItems.map((b, i) => (
                <RsCard key={b.id} item={b} meloloSlug={rsBridges.get(b.title)?.slug ?? null} index={i} />
              ))}
            </CarouselRow>
          </div>
        </Reveal>
      )}

      {/* DRAMA ASIA — semua episode terbuka */}
      <Reveal className="mt-12">
        <div className="head">
          <p className="eyebrow">Koleksi Drama Asia</p>
          <h2 className="text-2xl tracking-tightest">Drakor &amp; Drama Asia</h2>
          <div className="head-side">
            <p className="mono text-soft">
              <a href="/drakorku" className="go focus-ring rounded">
                Semua
              </a>
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {DK_CATEGORIES.slice(0, 14).map((c) => (
            <a
              key={c}
              href={`/drakorku/kategori/${slugify(c)}`}
              className="go focus-ring rounded-full border border-[--border] px-3 py-1.5 text-xs hover:border-[--accent] hover:text-[--accent]"
            >
              {c}
            </a>
          ))}
          <a href="/drakorku" className="go focus-ring rounded-full border border-[--accent] px-3 py-1.5 text-xs text-[--accent]">
            26 Genre →
          </a>
        </div>
        <div className="mt-4">
          <DkSection query="Romance" title="Drakor Romansa — Semua Episode Terbuka" eyebrow="Tonton Langsung" />
        </div>
      </Reveal>

      {/* DRAMA PENDEK — katalog baru */}
      <Reveal className="mt-12">
        <div className="head">
          <p className="eyebrow">Koleksi Baru</p>
          <h2 className="text-2xl tracking-tightest">Drama Pendek Populer</h2>
          <div className="head-side">
            <p className="mono text-soft">
              <a href="/dramabox" className="go focus-ring rounded">
                Semua
              </a>
            </p>
          </div>
        </div>
        <div className="mt-4">
          <DbSection title="Pilihan Minggu Ini — Semua Episode Gratis Terbuka" eyebrow="Tonton Langsung" />
        </div>
      </Reveal>

      {/* TERBARU DI KATEGORI */}
      {frItems.length > 0 && (
        <Reveal className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div className="head">
              <p className="eyebrow">Pilihan Terbaru</p>
              <h2 className="text-2xl tracking-tightest">Terbaru dari Katalog</h2>
            </div>
            <Link href="/reelshort" className="btn btn-ghost btn-sm focus-ring">
              Semua →
            </Link>
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

      {/* PUSAT GENRE — semua nama genre/kategori/karakter ada di satu tempat */}
      <Reveal className="mt-12">
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
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link href="/genres" className="panel focus-ring group p-5 transition hover:scale-[1.02] hover:border-accent/50">
            <p className="mono-accent font-mono text-xs uppercase tracking-mono">Genre</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">Semua genre video — dari Thriller sampai Romansa.</p>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-mono text-soft transition group-hover:text-accent">Buka →</p>
          </Link>
          <Link href="/genres" className="panel focus-ring group p-5 transition hover:scale-[1.02] hover:border-accent/50">
            <p className="mono-accent font-mono text-xs uppercase tracking-mono">Kategori</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">42 kategori utama + kategori lengkap lainnya.</p>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-mono text-soft transition group-hover:text-accent">Buka →</p>
          </Link>
          <Link href="/genres" className="panel focus-ring group p-5 transition hover:scale-[1.02] hover:border-accent/50">
            <p className="mono-accent font-mono text-xs uppercase tracking-mono">Karakter</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">CEO, Sultan, Alpha, Vampir — karakter favoritmu.</p>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-mono text-soft transition group-hover:text-accent">Buka →</p>
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
