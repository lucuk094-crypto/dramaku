'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { SearchResult } from '@/lib/melolo';
import { MediaGrid, PageHeader } from '@/components/MediaRow';
import { CardSkeleton } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import { IconSearch, IconX } from '@/components/Icons';

const TABS = [
  { id: 'series', label: 'Drama' },
  { id: 'novels', label: 'Novel' },
  { id: 'article', label: 'Artikel' },
  { id: 'all', label: 'Semua' },
];

function SearchContent() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQ = params.get('q') || '';

  const [query, setQuery] = useState(initialQ);
  const [tab, setTab] = useState('series');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const runSearch = useCallback(async (q: string, type: string, p: number, append = false) => {
    if (!q.trim()) {
      setResult(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}&page=${p}&size=12`);
      const data: SearchResult = await res.json();
      setResult((prev) =>
        append && prev ? { ...data, items: [...prev.items, ...data.items] } : data,
      );
    } catch {
      setResult({ query: q, type, page: p, page_size: 12, total: 0, total_pages: 0, type_counts: {}, items: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  // debounce ketikan
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      setPage(1);
      runSearch(query, tab, 1);
      if (query.trim()) {
        router.replace(`/search?q=${encodeURIComponent(query)}`, { scroll: false });
      }
    }, 450);
    return () => void (debounce.current && clearTimeout(debounce.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, tab]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    runSearch(query, tab, next, true);
  };

  return (
    <div className="container-x pb-16 pt-8">
      <PageHeader
        eyebrow="Pencarian — indeks katalog"
        title="Cari"
        subtitle="Temukan drama, novel, atau artikel favoritmu."
      />

      {/* kolom pencarian */}
      <div className="panel pad">
        <label className="mono text-soft" htmlFor="q">
          Kata kunci
        </label>
        <div className="relative mt-2">
          <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-soft" />
          <input
            id="q"
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik judul, misalnya “CEO” atau “kelahiran kembali”…"
            className="field"
            style={{ paddingLeft: '2.75rem', minHeight: '52px' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Bersihkan"
              className="focus-ring absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-soft transition hover:bg-bg hover:text-fg"
            >
              <IconX className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* tab tipe */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="tablist" role="tablist" aria-label="Tipe konten">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className="focus-ring"
              >
                {t.label}
              </button>
            ))}
          </div>
          {result && (
            <p className="mono text-soft">
              <b className="mono-accent font-normal">{result.total.toLocaleString('id-ID')}</b> hasil
            </p>
          )}
        </div>
      </div>

      {/* hasil */}
      <div className="mt-10">
        {loading && !result && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="[&>div]:w-full">
                <CardSkeleton />
              </div>
            ))}
          </div>
        )}

        {result && result.items.length > 0 && (
          <>
            <p className="mb-5 font-mono text-xs uppercase tracking-mono text-soft">
              Menampilkan {result.items.length} dari {result.total.toLocaleString('id-ID')} — “{result.query}”
            </p>
            <MediaGrid items={result.items} />
            {result.page < result.total_pages && (
              <div className="mt-10 flex justify-center">
                <button onClick={loadMore} disabled={loading} className="btn btn-ghost focus-ring">
                  {loading ? 'Memuat…' : 'Muat lebih banyak'}
                </button>
              </div>
            )}
          </>
        )}

        {result && result.items.length === 0 && !loading && (
          <EmptyState
            title="Tidak ada hasil"
            description={`Kami tidak menemukan apa pun untuk “${result.query}”. Coba kata kunci lain.`}
          />
        )}

        {!result && !loading && (
          <EmptyState
            title="Mulai mengetik untuk mencari"
            description="Cari drama favoritmu, atau jelajahi dari halaman Beranda."
            cta="Jelajahi Beranda"
            href="/"
          />
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
