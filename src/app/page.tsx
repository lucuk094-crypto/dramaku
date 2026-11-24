import Link from 'next/link';
import { getHome, enrichCards, getNewSeries, curateCards, fillRail, type MediaCard } from '@/lib/melolo';
import HeroCarousel from '@/components/HeroCarousel';
import ContinueRow from '@/components/ContinueRow';
import MediaRow from '@/components/MediaRow';
import RsHomeRails from '@/components/RsHomeRails';
import DkHomeRails from '@/components/DkHomeRails';
import Reveal from '@/components/Reveal';

export const revalidate = 300;

export default async function HomePage() {
  const home = await getHome().catch(() => ({ genres: [] as any[], sections: [] as any[] }));
  const news = await getNewSeries(20).catch(() => []);

  // Hero: prioritaskan judul bersinopsis (tampilan lebih kaya), unik per slug
  const seen = new Set<string>();
  const heroPool: MediaCard[] = [];
  for (const section of home.sections) {
    for (const item of section.items) {
      if (seen.has(item.slug)) continue;
      seen.add(item.slug);
      if (item.description || heroPool.length < 3) heroPool.push(item);
      if (heroPool.length >= 5) break;
    }
    if (heroPool.length >= 5) break;
  }

  // lengkapi metadata hero agar banner tampil kaya (sinopsis, jumlah episode)
  const heroItems = await enrichCards(heroPool);

  // ---- ANTI-DOBEL: satu judul tampil SATU KALI di seluruh katalog beranda ----
  const globalSeen = new Set<string>(heroItems.map((h) => h.slug));
  // "Baru Tayang" tampil duluan (fitur unggulan) — buang yang sudah di hero
  const newsItems = news.filter((n) => !globalSeen.has(n.slug));
  newsItems.forEach((n) => globalSeen.add(n.slug));
  // barisan katalog: dua fase — (1) buang yang sudah tampil + kurasi "yang
  // keren", (2) LENGKAPI sampai ~22 pilihan per barisan (geser lebih jauh),
  // suplemen tidak boleh memakan item dasar barisan lain
  const baseSections: { title: string; items: MediaCard[] }[] = [];
  for (const section of home.sections) {
    const curated = curateCards(section.items.filter((i) => !globalSeen.has(i.slug)));
    curated.forEach((i) => globalSeen.add(i.slug));
    if (curated.length >= 1) baseSections.push({ title: section.title, items: curated });
  }
  const sections: { title: string; items: MediaCard[] }[] = [];
  for (const s of baseSections) {
    const items = await fillRail(s.items, globalSeen, 22);
    if (items.length >= 3) sections.push({ title: s.title, items });
  }

  return (
    <div className="container-x space-y-9 pb-12 pt-4 md:pt-6">
      {heroItems.length > 0 && <HeroCarousel items={heroItems} />}

      <ContinueRow />

      {/* BARU TAYANG — rilisan terbaru, real-time dari sumber */}
      {newsItems.length > 0 && (
        <Reveal>
          <MediaRow
            title="Baru Tayang"
            eyebrow="Real-time — 2026 →"
            items={newsItems.map((n) => ({
              type: 'series' as const,
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
            }))}
            hrefMore="/baru-tayang"
          />
        </Reveal>
      )}

      {/* REELSHORT — katalog drama global, bisa diputar langsung */}
      <RsHomeRails />

      {/* DRAKORKU — drakor & drama Asia, semua episode terbuka */}
      <DkHomeRails />

      {/* genre cepat */}
      {home.genres.length > 0 && (
        <Reveal>
          <section className="panel p-5 sm:p-6">
            <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Indeks genre</p>
                <h2 className="mt-1.5 text-lg font-medium tracking-tight">Jelajahi Genre</h2>
              </div>
              <Link href="/genres" className="go focus-ring rounded">
                Semua genre
              </Link>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {home.genres
                .filter((g: any) => g.slug !== 'dokter')
                .map((genre) => (
                  <Link key={genre.slug} href={`/genres/${genre.slug}`} className="chip focus-ring">
                    {genre.name}
                  </Link>
                ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/[var(--border-alpha)] pt-3">
              <span className="mono text-soft">Pilihan lain</span>
              <Link href="/genres" className="chip focus-ring">
                Kategori
              </Link>
              <Link href="/genres" className="chip focus-ring">
                Karakter
              </Link>
              <Link href="/drakorku" className="chip focus-ring">
                Drama Asia
              </Link>
              <Link href="/jelajah/jenis/ai" className="chip focus-ring">
                Drama AI
              </Link>
              <Link href="/jelajah/jenis/anime" className="chip focus-ring">
                Anime
              </Link>
              <Link href="/genres" className="go focus-ring rounded">
                Semua
              </Link>
            </div>
          </section>
        </Reveal>
      )}

      {/* barisan drama */}
      {sections.map((section, i) => (
        <Reveal key={section.title} className="pt-0">
          <MediaRow
            title={section.title}
            items={section.items}
            eyebrow={`0${Math.min(i + 1, 9)} — Katalog`}
          />
        </Reveal>
      ))}

      {sections.length === 0 && (
        <div className="panel pad text-center">
          <p className="mono text-soft">Status — offline</p>
          <p className="mt-3 text-muted">
            Katalog belum bisa dimuat saat ini. Coba muat ulang beberapa saat lagi.
          </p>
        </div>
      )}
    </div>
  );
}
