import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getNovel, getNovelChapter } from '@/lib/melolo';
import BackButton from '@/components/BackButton';
import Reveal from '@/components/Reveal';
import NovelProgressSaver from '@/components/NovelProgressSaver';
import { IconChevronLeft, IconChevronRight, IconList } from '@/components/Icons';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { slug: string; n: string } }): Promise<Metadata> {
  try {
    const [novel, ch] = await Promise.all([getNovel(params.slug), getNovelChapter(params.slug, Number(params.n))]);
    return { title: `${novel.title} — Bab ${ch.chapter}` };
  } catch {
    return { title: 'Baca Novel' };
  }
}

export default async function NovelChapterPage({ params }: { params: { slug: string; n: string } }) {
  const n = Math.max(1, Number.parseInt(params.n, 10) || 1);

  let novel;
  try {
    novel = await getNovel(params.slug);
  } catch (err: any) {
    if (err?.status === 404) notFound();
    throw err;
  }

  if (novel.total_chapters !== null && n > novel.total_chapters) notFound();

  // Bab di luar yang tersedia → panel ramah + lompat ke yang bisa dibaca
  let chapter = null;
  if (n <= novel.available_chapters) {
    try {
      chapter = await getNovelChapter(params.slug, n);
    } catch {
      chapter = null;
    }
  }

  if (!chapter) {
    return (
      <div className="container-x pb-16 pt-6">
        <div className="mx-auto max-w-3xl">
          <BackButton />
          <Reveal>
            <div className="panel mt-6 p-8">
              <p className="eyebrow">Info</p>
              <h1 className="mt-2 text-2xl font-medium tracking-tightest">Bab {n} segera dirilis</h1>
              <p className="mt-3 max-w-2xl leading-relaxed text-muted">
                {novel.title} memiliki {novel.total_chapters ?? '?'} bab, tetapi baru {novel.available_chapters} bab
                yang bisa dibaca untuk saat ini. Bab lainnya segera dirilis.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Link href={`/novels/${novel.novels_slug}/chapter/${novel.available_chapters}`} className="btn btn-main focus-ring">
                  Baca Bab {novel.available_chapters} →
                </Link>
                <Link href={`/novels/${novel.novels_slug}/chapter/1`} className="btn btn-ghost focus-ring">
                  Mulai dari Bab 1
                </Link>
                <Link href={`/novels/${novel.novels_slug}`} className="btn btn-ghost focus-ring">
                  ← Kembali ke detail
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x pb-20 pt-6">
      <div className="mx-auto max-w-3xl">
        <NovelProgressSaver slug={novel.novels_slug} chapter={chapter.chapter} title={novel.title} />
        <BackButton />

        {/* kepala bab */}
        <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/novels/${novel.novels_slug}`} className="focus-ring rounded text-sm text-accent hover:underline">
              {novel.title}
            </Link>
            <h1 className="mt-1 text-3xl font-medium leading-tight tracking-tightest">{chapter.title}</h1>
          </div>
          <p className="font-mono text-xs uppercase tracking-mono text-soft">
            Bab {chapter.chapter} / {novel.total_chapters ?? novel.available_chapters}
          </p>
        </div>

        {/* isi bab */}
        <article className="panel mt-8 px-6 py-8 sm:px-10 sm:py-10">
          {chapter.paragraphs.map((p, i) => (
            <p key={i} className="mt-5 text-[1.0625rem] leading-[1.95] text-fg/90 first:mt-0">
              {p}
            </p>
          ))}
        </article>

        {/* navigasi bab */}
        <nav className="mt-8 flex flex-wrap items-center justify-between gap-3">
          {chapter.chapter > 1 ? (
            <Link href={`/novels/${novel.novels_slug}/chapter/${chapter.chapter - 1}`} className="btn btn-ghost focus-ring">
              <IconChevronLeft className="h-4 w-4" /> Bab Sebelumnya
            </Link>
          ) : (
            <span />
          )}
          <Link href={`/novels/${novel.novels_slug}`} className="btn btn-ghost focus-ring">
            <IconList className="h-4 w-4" /> Daftar Isi
          </Link>
          {chapter.chapter < novel.available_chapters ? (
            <Link href={`/novels/${novel.novels_slug}/chapter/${chapter.chapter + 1}`} className="btn btn-main focus-ring">
              Bab Berikutnya <IconChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span />
          )}
        </nav>

        <p className="mt-10 text-center font-mono text-[11px] uppercase tracking-mono text-soft">
          Selesai membaca Bab {chapter.chapter} · lanjutkan dari Daftar Isi kapan saja
        </p>
      </div>
    </div>
  );
}
