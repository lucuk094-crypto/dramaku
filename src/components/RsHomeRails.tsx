import { getRsNewRelease, getRsTagBooks, mergeRsPages, type RsBook, type RsPage } from '@/lib/reelshort';
import { bridgeMany } from '@/lib/flickreels';
import Reveal from './Reveal';
import CarouselRow from './CarouselRow';
import RsCard from './RsCard';

/** ambil n item unik pertama (dedupe lintas rail per judul) */
function take(items: RsBook[], seen: Set<string>, n: number): RsBook[] {
  const out: RsBook[] = [];
  for (const b of items) {
    const key = b.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(b);
    if (out.length >= n) break;
  }
  return out;
}

/**
 * Dua rail ReelShort untuk beranda — rilisan terbaru + pilihan genre populer,
 * dijembatani ke katalog tonton kami bila judulnya tersedia (anti-dobel
 * lintas rail).
 */
export default async function RsHomeRails() {
  const [fresh, romance, fantasi, miliarder] = await Promise.all([
    getRsNewRelease(1).catch(() => null),
    getRsTagBooks('Romansa', 1).catch(() => null),
    getRsTagBooks('Fantasi', 1).catch(() => null),
    getRsTagBooks('Miliarder', 1).catch(() => null),
  ]);

  const seen = new Set<string>();
  const freshItems = take(fresh?.items || [], seen, 18);
  const genrePool = mergeRsPages(
    [romance, fantasi, miliarder].filter((p): p is RsPage => !!p),
    36,
  );
  const genreItems = take(genrePool, seen, 24);

  const all = [...freshItems, ...genreItems];
  if (all.length === 0) return null;
  const bridges = await bridgeMany(all.map((b) => b.title)).catch(() => new Map());

  return (
    <>
      {freshItems.length > 0 && (
        <Reveal className="pt-0">
          <section>
            <div className="head">
              <p className="eyebrow">Koleksi Drama Global</p>
              <h2>Rilisan Baru</h2>
              <div className="head-side">
                <p className="mono text-soft">
                  <a href="/reelshort" className="go focus-ring rounded">
                    Semua
                  </a>
                </p>
              </div>
            </div>
            <CarouselRow>
              {freshItems.map((b, i) => (
                <RsCard key={b.id} item={b} meloloSlug={bridges.get(b.title)?.slug ?? null} index={i} />
              ))}
            </CarouselRow>
          </section>
        </Reveal>
      )}

      {genreItems.length > 0 && (
        <Reveal className="pt-0">
          <section>
            <div className="head">
              <p className="eyebrow">Pilihan Populer</p>
              <h2>Romansa, Fantasi & Miliarder</h2>
              <div className="head-side">
                <p className="mono text-soft">
                  <a href="/reelshort" className="go focus-ring rounded">
                    Semua
                  </a>
                </p>
              </div>
            </div>
            <CarouselRow>
              {genreItems.map((b, i) => (
                <RsCard key={b.id} item={b} meloloSlug={bridges.get(b.title)?.slug ?? null} index={i} />
              ))}
            </CarouselRow>
          </section>
        </Reveal>
      )}
    </>
  );
}
