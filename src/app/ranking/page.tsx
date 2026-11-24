import { getRanking } from '@/lib/melolo';
import { MediaGrid, PageHeader } from '@/components/MediaRow';
import Reveal from '@/components/Reveal';

export const dynamic = 'force-dynamic'; // render saat runtime — build bebas tarik data hulu

export default async function RankingPage() {
  const sections = await getRanking().catch(() => []);

  return (
    <div className="container-x space-y-16 pb-16 pt-8">
      <PageHeader
        eyebrow="Papan peringkat — diperbarui berkala"
        title="Peringkat Populer"
        subtitle="Drama paling banyak ditonton pekan ini, diperbarui secara berkala."
      />

      {sections.map((section, si) => (
        <Reveal key={section.title}>
          <section>
            <div className="head">
              <p className="eyebrow">
                {String(si + 1).padStart(2, '0')} — Klasemen
              </p>
              <h2>{section.title}</h2>
              <div className="head-side">
                <p className="mono text-soft">
                  Total <b className="mono-accent font-normal">{section.items.length}</b> judul
                </p>
              </div>
            </div>
            <MediaGrid items={section.items} showRank />
          </section>
        </Reveal>
      ))}

      {sections.length === 0 && (
        <div className="panel pad text-center">
          <p className="mono text-soft">Status — offline</p>
          <p className="mt-3 text-muted">Data peringkat belum bisa dimuat saat ini.</p>
        </div>
      )}
    </div>
  );
}
