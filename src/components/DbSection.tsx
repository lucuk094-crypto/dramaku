import Link from 'next/link';
import { dbBrowse } from '@/lib/dramabox';
import CarouselRow from './CarouselRow';

interface Props {
  title?: string;
  eyebrow?: string;
  genreId?: number;
  target?: number;
  className?: string;
}

/**
 * Rail lengkapan katalog drama pendek — server component, kartu bisa diklik,
 * gaya carousel seragam di semua halaman.
 */
export default async function DbSection({
  title = 'Drama Pendek — Semua Episode Gratis Terbuka',
  eyebrow = 'Koleksi Baru',
  genreId = 0,
  target = 18,
  className = '',
}: Props) {
  const cards: { bookId: string; title: string; cover: string; chapterCount: number }[] = [];
  for (let page = 1; cards.length < target && page <= 3; page += 1) {
    const r = await dbBrowse(genreId, page).catch(() => null);
    if (!r) break;
    for (const b of r.books) {
      if (cards.length >= target) break;
      if (!cards.some((c) => c.bookId === b.bookId)) {
        cards.push({ bookId: b.bookId, title: b.title, cover: b.cover, chapterCount: b.chapterCount });
      }
    }
  }
  if (cards.length === 0) return null;

  return (
    <section className={className}>
      <div className="head">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="text-2xl tracking-tightest">{title}</h2>
        <div className="head-side">
          <p className="mono text-soft">
            <a href="/dramabox" className="go focus-ring rounded">
              Semua
            </a>
          </p>
        </div>
      </div>

      <CarouselRow className="mt-5">
        {cards.map((c) => (
          <Link
            key={c.bookId}
            href={`/dramabox/judul/${c.bookId}`}
            className="panel panel-hover focus-ring group w-[150px] shrink-0 overflow-hidden sm:w-[170px]"
          >
            <div className="media-poster relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.cover}
                alt={c.title}
                loading="lazy"
                className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.06]"
              />
              <div className="veil absolute inset-0" />
            </div>
            <div className="p-2.5">
              <h3 className="line-clamp-2 text-xs font-medium leading-snug tracking-tight">{c.title}</h3>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-mono text-soft">
                {c.chapterCount > 0 ? `${c.chapterCount} episode` : 'episode lengkap'}
              </p>
            </div>
          </Link>
        ))}
      </CarouselRow>
    </section>
  );
}
