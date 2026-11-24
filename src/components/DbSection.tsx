import Link from 'next/link';
import { dbBrowse } from '@/lib/dramabox';
import CarouselRow from './CarouselRow';
import { IconPlay } from './Icons';

interface Props {
  title?: string;
  eyebrow?: string;
  genreId?: number;
  target?: number;
  className?: string;
  /** Sembunyikan judul internal — dipakai saat rail ditempatkan di bawah judul halaman. */
  hideHead?: boolean;
}

/**
 * Rail lengkapan katalog drama pendek — server component, kartu bisa diklik,
 * gaya kartu seragam dengan rail lain (cover + chip episode + judul + meta).
 */
export default async function DbSection({
  title = 'Drama Pendek — Semua Episode Gratis Terbuka',
  eyebrow = 'Koleksi Baru',
  genreId = 0,
  target = 18,
  className = '',
  hideHead = false,
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
      {!hideHead && (
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
      )}

      <CarouselRow className="mt-5">
        {cards.map((c) => (
          <Link
            key={c.bookId}
            href={`/dramabox/judul/${c.bookId}`}
            aria-label={c.title}
            className="focus-ring group block w-[150px] shrink-0 rounded text-left transition duration-300 hover:-translate-y-1 sm:w-[170px]"
          >
            <div className="media-poster">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.cover}
                alt={c.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="transition duration-500 group-hover:scale-[1.06]"
              />
              <div className="veil" />
              <div className="absolute bottom-2 left-2 rounded-sm bg-black/55 px-2 py-0.5 font-mono text-[10px] uppercase tracking-mono text-white">
                {c.chapterCount > 0 ? `${c.chapterCount} Ep` : 'Lengkap'}
              </div>
              <div className="absolute right-2 top-2 rounded-sm bg-accent px-2 py-0.5 font-mono text-[10px] uppercase tracking-mono text-[rgb(var(--btn-text))]">
                Tonton
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-[rgb(var(--btn-text))] shadow-lg">
                  <IconPlay className="h-4 w-4" />
                </div>
              </div>
            </div>
            <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug tracking-tight">{c.title}</p>
            <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-mono text-soft">
              {c.chapterCount > 0 ? `${c.chapterCount} episode` : 'Episode lengkap'}
            </p>
          </Link>
        ))}
      </CarouselRow>
    </section>
  );
}
