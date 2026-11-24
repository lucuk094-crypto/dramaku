# 🎬 DramaKu

Web streaming drama pendek bergaya Melolo — **Next.js 14 + Tailwind CSS + Framer Motion**.
Desain clean minimalist modern, animasi halus, fitur lengkap, siap deploy ke **Vercel**.

> Katalog real-time dari [Melolo](https://melolo.com). Video di-streaming melalui proxy server
> (URL CDN Melolo mewajibkan `Referer: melolo.com` + URL sign berlaku ~5 menit).

---

## ✨ Fitur

| Fitur | Keterangan |
|---|---|
| 🏠 Beranda | Hero carousel animasi, barisan drama per-genre, jelajahi genre |
| 🔍 Pencarian | Debounced search + tab Drama / Novel / Artikel / Semua, muat-lebih-banyak |
| 🎭 Genre | Tile gradien + halaman genre dengan paginasi |
| 🏆 Peringkat | Ranking mingguan dengan badge nomor |
| 📄 Detail drama | Sinopsis, pemeran, galeri, info lengkap, rekomendasi & artikel terkait |
| ▶️ Player kustom | Seek bar, volume, kecepatan 0.5–2×, layar penuh, keyboard shortcut, double-tap ±10 dtk |
| ⏭️ Auto-next | Hitung mundur ke episode berikutnya + toggle ON/OFF |
| ❤️ Favorit | Simpan drama (localStorage / Supabase) |
| 🕘 Riwayat | Lanjutkan menonton dari menit terakhir, baris "Lanjutkan Menonton" |
| 🌗 Tema | Dark (default) & light mode, anti-FOUC |
| 📱 Responsif | Bottom-nav mobile, grid adaptif, safe-area notch |
| 🎞️ Animasi | Framer Motion: transisi halaman, stagger kartu, hero crossfade, spring buttons |
| 🗄️ Supabase-ready | `supabase/schema.sql` siap jalankan untuk sinkronisasi cloud |

## 🚀 Cara Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build produksi
npm start          # jalankan hasil build
```

Node.js 18.17+ (disarankan 20).

## ☁️ Deploy ke Vercel

**Cara 1 — Vercel CLI:**

```bash
npm i -g vercel
vercel            # ikuti pertanyaan, framework terdeteksi otomatis (Next.js)
vercel --prod     # deploy produksi
```

**Cara 2 — GitHub:**

1. Push folder ini ke repository GitHub.
2. Buka [vercel.com/new](https://vercel.com/new) → import repository.
3. Vercel otomatis mendeteksi Next.js → klik **Deploy**.

Tidak perlu environment variable apa pun untuk mode tamu (default).

## 🗄️ Menghubungkan Supabase (opsional)

Default-nya favorit & riwayat tersimpan di **localStorage** per perangkat (mode tamu, tanpa login).
Untuk sinkronisasi cloud:

1. Buat project di [supabase.com](https://supabase.com) (plan gratis cukup).
2. Buka **SQL Editor** → jalankan isi `supabase/schema.sql`.
3. Ambil **Project URL** + **anon public key** di Settings → API.
4. Isi `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   ```

5. Deploy ulang / restart dev server.

> Skema memakai `device_id` (mode tamu). Saat nanti menambahkan login Supabase Auth,
> tinggal ganti policy RLS ke `auth.uid()` — contoh ada di komentar `schema.sql`.

## 🗂️ Struktur Proyek

```
src/
├── app/
│   ├── page.tsx                 # Beranda (hero + rows)
│   ├── search/                  # Pencarian (tab tipe)
│   ├── genres/, genres/[slug]/  # Jelajahi genre + paginasi
│   ├── ranking/                 # Peringkat populer
│   ├── series/[slug]/           # Detail drama
│   ├── watch/[slug]/[ep]/       # Player
│   ├── novels/[slug]/           # Info novel (link ke Melolo)
│   ├── favorites/, history/     # Favorit & riwayat
│   └── api/
│       ├── search/              # Proxy API pencarian
│       └── video/[slug]/[ep]/   # 🔑 Proxy streaming video (Range + sign)
├── components/                  # Navbar, Player, HeroCarousel, MediaCard, dll.
├── lib/
│   ├── melolo.ts                # Lapisan data katalog (HTML + API Melolo)
│   ├── store.ts                 # Favorit & riwayat (localStorage, Supabase-ready)
│   └── format.ts                # Util format
supabase/schema.sql              # Skema database cloud
```

## ⚙️ Catatan Teknis

- **Proxy video** (`/api/video/[slug]/[ep]`): mengambil URL sign segar (cache 240 dtk),
  meneruskan header `Range` (seek tetap jalan), lalu mengalirkan byte video ke browser.
  Tanpa proxy ini video tidak bisa diputar karena CDN Melolo memblokir Referer asing.
- **Cache server**: halaman katalog memakai ISR (revalidate 5–60 menit) sehingga cepat
  dan ramah terhadap sumber data.
- **Subjudul** menempel pada video (burned-in) — mengikuti sumber stream.

## ⚖️ Legal

Aplikasi ini menampilkan katalog & stream publik dari Melolo untuk keperluan pembelajaran/demo.
Konten adalah milik pencipta/pemegang haknya masing-masing. Gunakan secara bertanggung jawab.

---

Dibuat dengan ❤️ memakai Next.js, Tailwind CSS, dan Framer Motion.
