import { dkSeriesCards } from '@/lib/drakorku';
import CarouselRow from './CarouselRow';
import DkCard from './DkCard';

/**
 * Rail Drakorku di beranda — serial populer (semua episode bisa diputar).
 */
export default async function DkHomeRails() {
  const [first, second] = await Promise.all([
    dkSeriesCards('Eps 01', 20).catch(() => []),
    dkSeriesCards('Eps 02', 20).catch(() => []),
  ]);

  // gabung anti-dobel lintas rail
  const seen = new Set<string>();
  const take = (rows: typeof first, n: number) => {
    const out: typeof first = [];
    for (const r of rows) {
      if (seen.has(r.slug) || !r.playable) continue;
      seen.add(r.slug);
      out.push(r);
      if (out.length >= n) break;
    }
    return out;
  };
  const railA = take(first, 18);
  const railB = take(second, 18);
  if (railA.length + railB.length === 0) return null;

  const card = (c: (typeof railA)[number], i: number) => (
    <DkCard
      key={c.slug}
      index={i}
      name={c.name}
      slug={c.slug}
      cover={c.cover}
      meta={[c.year || '', c.rating ? `★ ${c.rating}` : ''].filter(Boolean).join(' · ')}
      genreLine={c.genre}
      badge="Tonton"
      href={`/drakorku/tonton/${c.slug}`}
    />
  );

  return (
    <>
      {railA.length > 0 && (
        <section>
          <div className="head">
            <p className="eyebrow">Semua Episode Terbuka</p>
            <h2 className="text-2xl tracking-tightest">Drakor &amp; Drama Asia Pilihan</h2>
            <div className="head-side">
              <p className="mono text-soft">
                <a href="/drakorku" className="go focus-ring rounded">
                  Semua
                </a>
              </p>
            </div>
          </div>
          <CarouselRow>{railA.map(card)}</CarouselRow>
        </section>
      )}
      {railB.length > 0 && (
        <section>
          <div className="head">
            <p className="eyebrow">Koleksi Lengkap</p>
            <h2 className="text-2xl tracking-tightest">Drakor &amp; Drama Asia Terpopuler</h2>
            <div className="head-side">
              <p className="mono text-soft">
                <a href="/drakorku" className="go focus-ring rounded">
                  Semua
                </a>
              </p>
            </div>
          </div>
          <CarouselRow>{railB.map(card)}</CarouselRow>
        </section>
      )}
    </>
  );
}
