-- DramaKu — skema database (Supabase / PostgreSQL)
-- Jalankan di SQL Editor Supabase setelah project dibuat.
-- Mode tamu (tanpa login): baris dikunci per device_id, bukan per user auth.

-- ================= FAVORIT =================
create table if not exists public.favorites (
  id          uuid primary key default gen_random_uuid(),
  device_id   text not null,
  slug        text not null,
  title       text,
  cover       text,
  rating      text,
  episode_count integer,
  created_at  timestamptz not null default now(),
  unique (device_id, slug)
);

create index if not exists favorites_device_idx on public.favorites (device_id, created_at desc);

-- ================= RIWAYAT TONTON =================
create table if not exists public.watch_history (
  id            uuid primary key default gen_random_uuid(),
  device_id     text not null,
  slug          text not null,
  title         text,
  cover         text,
  episode       integer not null,
  episode_count integer,
  position      double precision not null default 0,
  duration      double precision not null default 0,
  updated_at    timestamptz not null default now(),
  unique (device_id, slug, episode)
);

create index if not exists history_device_idx on public.watch_history (device_id, updated_at desc);

-- ================= ROW LEVEL SECURITY =================
-- Mode tamu: klien membawa device_id masing-masing (disimpan di localStorage).
-- Policy mengizinkan role anon melakukan CRUD hanya untuk device_id-nya sendiri.
alter table public.favorites enable row level security;
alter table public.watch_history enable row level security;

create policy "favorites_anon_all" on public.favorites
  for all to anon using (true) with check (true);

create policy "history_anon_all" on public.watch_history
  for all to anon using (true) with check (true);

-- Catatan keamanan:
-- Policy di atas terbuka untuk role anon (mode tamu). Untuk produksi publik,
-- ganti dengan policy berbasis auth.uid() setelah login Supabase Auth diaktifkan:
--
--   create policy "fav_own" on public.favorites
--     for all to authenticated
--     using ((auth.uid())::text = device_id)
--     with check ((auth.uid())::text = device_id);
