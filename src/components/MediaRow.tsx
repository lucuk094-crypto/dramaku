'use client';

import Link from 'next/link';
import type { MediaCard as CardType } from '@/lib/melolo';
import MediaCard from './MediaCard';
import CarouselRow from './CarouselRow';

interface Props {
  title: string;
  items: CardType[];
  hrefMore?: string;
  eyebrow?: string;
  showRank?: boolean;
  wide?: boolean;
}

/**
 * Baris media geser — shell CarouselRow (animasi masuk bertahap, geser mulus,
 * panah bulat, gradien tepi) + kartu hover-3D/expand. Kepala bagian:
 * eyebrow mono + judul + tautan "lihat semua".
 */
export default function MediaRow({ title, items, hrefMore, eyebrow, showRank = false, wide = false }: Props) {
  if (!items?.length) return null;

  return (
    <section>
      <div className="head">
        <p className="eyebrow">{eyebrow || 'Koleksi'}</p>
        <h2>{title}</h2>
        <div className="head-side">
          {hrefMore && (
            <Link href={hrefMore} className="go focus-ring rounded">
              Lihat semua
            </Link>
          )}
        </div>
      </div>

      <CarouselRow>
        {items.map((item, i) => (
          <MediaCard key={`${item.slug}-${i}`} item={item} index={i} showRank={showRank} wide={wide} />
        ))}
      </CarouselRow>
    </section>
  );
}

/** Grid responsif untuk halaman kategori/pencarian. */
export function MediaGrid({ items, showRank = false }: { items: CardType[]; showRank?: boolean }) {
  return (
    <div className="grid grid-cols-2 items-start gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
      {items.map((item, i) => (
        <MediaCard key={`${item.slug}-${i}`} item={item} index={i} showRank={showRank} fluid />
      ))}
    </div>
  );
}

/** Header halaman: eyebrow mono + judul besar rapat + garis rambut. */
export function PageHeader({
  title,
  subtitle,
  eyebrow,
  children,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="head">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="text-3xl font-medium tracking-tightest">{title}</h1>
      {subtitle && <p className="mt-2 max-w-2xl leading-relaxed text-muted">{subtitle}</p>}
      {children}
    </div>
  );
}
