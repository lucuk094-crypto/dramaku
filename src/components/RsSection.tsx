import { getRsNewTagBooks, getRsTagBooks, mergeRsPages, type RsBook, type RsPage } from '@/lib/reelshort';
import { rsNewTagFor, rsTagsFor } from '@/lib/taxonomy';
import { bridgeMany } from '@/lib/flickreels';
import CarouselRow from './CarouselRow';
import RsCard from './RsCard';

interface Props {
  /** nama genre/kategori/karakter kita — dipetakan otomatis ke tag ReelShort */
  mapKey: string;
  title?: string;
  eyebrow?: string;
  /** jumlah maksimum kartu (default 24) */
  target?: number;
  className?: string;
}

/**
 * Panel lengkapan katalog ReelShort untuk genre/kategori yang masih
 * kosong/kurang lengkap. Server component: ambil per tag → gabung anti-dobel
 * → jembatani judul yang sama ke katalog tonton kami (bila ada).
 */
export default async function RsSection({
  mapKey,
  title,
  eyebrow = 'Lengkapan Katalog',
  target = 24,
  className = '',
}: Props) {
  const tagNames = rsTagsFor(mapKey);
  const newTag = rsNewTagFor(mapKey);

  // 2 halaman per tag → lebih dalam (termasuk rilisan tahun-tahun sebelumnya)
  const jobs: Promise<RsPage>[] = tagNames.flatMap((t) =>
    [1, 2].map((hal) =>
      getRsTagBooks(t, hal).catch(() => ({ items: [], total: 0, totalPage: 1, page: hal, tagName: t })),
    ),
  );
  if (newTag) {
    jobs.push(
      getRsNewTagBooks(newTag.category, newTag.id, newTag.name).catch(() => ({
        items: [],
        total: 0,
        totalPage: 1,
        page: 1,
        tagName: newTag.name,
      })),
    );
  }

  const pages = await Promise.all(jobs);
  const items: RsBook[] = mergeRsPages(pages, target);
  if (items.length === 0) return null;

  // jembatan judul → katalog tonton kami (bila seri yang sama tersedia)
  const bridges = await bridgeMany(items.map((b) => b.title)).catch(() => new Map());

  const totalAll = pages.reduce((n, p) => n + (p.total || 0), 0);

  return (
    <section className={className}>
      <div className="head">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title || 'Pilihan Unggulan'}</h2>
        <div className="head-side">
          <p className="mono text-soft">
            {totalAll > 0 ? `${totalAll.toLocaleString('id-ID')} judul` : ''} · sumber: reelshort.com
          </p>
        </div>
      </div>

      <CarouselRow>
        {items.map((b, i) => (
          <RsCard key={b.id} item={b} meloloSlug={bridges.get(b.title)?.slug ?? null} index={i} />
        ))}
      </CarouselRow>
    </section>
  );
}
