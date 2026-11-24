import { dkGenreCards, dkSeriesCards, DK_GENRE_MAP } from '@/lib/drakorku';
import CarouselRow from './CarouselRow';
import DkCard from './DkCard';

interface Props {
  /** kata kunci / nama genre kita (otomatis dipetakan ke kategori Drakorku) */
  query: string;
  title?: string;
  eyebrow?: string;
  target?: number;
  className?: string;
}

/**
 * Rail lengkapan katalog Drakorku (drakor/drama Asia) untuk semua halaman
 * genre/kategori. Server component — anti-dobel, kartu bisa diklik.
 */
export default async function DkSection({ query, title, eyebrow = 'Koleksi Drama Asia', target = 18, className = '' }: Props) {
  let cards = await dkGenreCards(query, target).catch(() => []);
  if (cards.length < 6) {
    const extra = await dkSeriesCards('Eps 01', target + 8).catch(() => []);
    const seen = new Set(cards.map((c) => c.slug));
    cards = [...cards, ...extra.filter((c) => !seen.has(c.slug) && c.playable)].slice(0, target);
  }
  if (cards.length === 0) return null;

  const label = title || `Drakor & Drama Asia — ${DK_GENRE_MAP[query.toLowerCase()] || query}`;

  return (
    <section className={className}>
      <div className="head">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="text-2xl tracking-tightest">{label}</h2>
        <div className="head-side">
          <p className="mono text-soft">
            <a href="/drakorku" className="go focus-ring rounded">
              Semua
            </a>
          </p>
        </div>
      </div>

      <CarouselRow>
        {cards.map((c, i) => (
          <DkCard
            key={c.slug}
            index={i}
            name={c.name}
            slug={c.slug}
            cover={c.cover}
            meta={[c.year || '', c.rating ? `★ ${c.rating}` : ''].filter(Boolean).join(' · ')}
            genreLine={c.genre}
            badge={c.playable ? 'Tonton' : 'Detail'}
            href={c.playable ? `/drakorku/tonton/${c.slug}` : `/drakorku/serial/${c.slug}`}
          />
        ))}
      </CarouselRow>
    </section>
  );
}
