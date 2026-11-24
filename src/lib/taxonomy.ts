/**
 * Taksonomi Jelajah — pemetaan nama kategori & karakter (sesuai daftar melolo app)
 * ke tag_id katalog FlickReels (Bahasa Indonesia). Beberapa istilah tanpa tag
 * khusus dialihkan ke pencarian kata kunci live (`/jelajah/cari?kata=`).
 */

export interface TaxItem {
  /** nama tampilan (mengikuti daftar melolo) */
  name: string;
  /** tag_id katalog — jika null, gunakan pencarian kata kunci `q` */
  tagId: number | null;
  q?: string;
}

/** KATEGORI — persis 42 istilah yang Anda sebutkan, urut sesuai daftar. */
export const KATEGORI_UTAMA: TaxItem[] = [
  { name: 'Bangkit', tagId: 1754 },
  { name: 'Time Travel', tagId: 1802 },
  { name: 'Sistem', tagId: 2985 },
  { name: 'Kekuatan Super', tagId: 1962 },
  { name: 'Reinkarnasi', tagId: 1834 },
  { name: 'Identitas Tersembunyi', tagId: 1631 },
  { name: 'Cinta Setelah Pernikahan', tagId: 2318 },
  { name: 'Pembalasan Dendam', tagId: 2274 },
  { name: 'Keluarga', tagId: 1512 },
  { name: 'Bayi Lucu', tagId: 1607 },
  { name: 'Cinta Satu Malam', tagId: 1738 },
  { name: 'Romansa Manis', tagId: 4619 },
  { name: 'Harem', tagId: 1978 },
  { name: 'Cinta Terpendam', tagId: 1858 },
  { name: 'Kembalinya Sang Kuat', tagId: 4139 },
  { name: 'Keluarga Konglomerat', tagId: 1639 },
  { name: 'Mengejar Cinta Istri', tagId: 2420 },
  { name: 'Putri yang Tertukar', tagId: 2343 },
  { name: 'Dunia Kerja', tagId: 1970 },
  { name: 'Tak Terkalahkan', tagId: 4539 },
  { name: 'Anak Kesayangan', tagId: 2937 },
  { name: 'Komedi', tagId: 2307 },
  { name: 'Amnesia', tagId: null, q: 'amnesia' },
  { name: 'Romansa Tragis', tagId: 1938 },
  { name: 'CLBK', tagId: 1866 },
  { name: 'Cinta pada Pandangan Pertama', tagId: 1946 },
  { name: 'Perselingkuhan', tagId: 2070 },
  { name: 'Cinta Segitiga', tagId: 1906 },
  { name: 'Pedesaan', tagId: 2886 },
  { name: 'Kehamilan', tagId: 2354 },
  { name: 'Kekasih Masa Kecil', tagId: null, q: 'kekasih masa kecil' },
  { name: 'Komedi Romantis', tagId: 1504 },
  { name: 'Kampus', tagId: 1536 },
  { name: 'Dari Musuh Jadi Cinta', tagId: null, q: 'musuh' },
  { name: 'Kiamat', tagId: 4491 },
  { name: 'Harem Terbalik', tagId: 2946 },
  { name: 'Pertukaran Jiwa', tagId: null, q: 'jiwa' },
  { name: 'Aksi', tagId: 4443 },
  { name: 'Dunia Hiburan', tagId: 1647 },
  { name: 'Cinta Terlarang', tagId: 1778 },
  { name: 'Pertukaran Tubuh', tagId: null, q: 'tubuh' },
];

/** KARAKTER — CEO, wanita tangguh, sultan, dokter, dst. */
export const KARAKTER_UTAMA: TaxItem[] = [
  { name: 'CEO', tagId: 1583 },
  { name: 'Wanita Tangguh', tagId: 1687 },
  { name: 'Sultan', tagId: 2068 },
  { name: 'Dokter', tagId: 2365 },
  { name: 'Rakyat Jelata', tagId: 2067 },
  { name: 'Keluarga Kerajaan', tagId: 3007 },
  { name: 'Dewa Perang', tagId: 1679 },
  { name: 'Dewa', tagId: 4523 },
  { name: 'Permaisuri', tagId: 2926 },
  { name: 'Jenderal', tagId: 2955 },
  { name: 'Mafia', tagId: 1615 },
  { name: 'Cinderella', tagId: 1671 },
  { name: 'Bad Boy', tagId: 1623 },
  { name: 'Alpha', tagId: 1794 },
  { name: 'Serigala', tagId: 1599 },
  { name: 'Vampir', tagId: 1591 },
  { name: 'Penyihir', tagId: 4587 },
  { name: 'Naga', tagId: 4603 },
];

/** Jenis — tab Drama / AI / Anime (halaman masing-masing di /jelajah/jenis/[type]). */
export const JENIS: { type: string; name: string; desc: string }[] = [
  { type: 'drama', name: 'Drama', desc: 'Katalog drama pendek utama — kategori, karakter, dan rilisan terbaru.' },
  { type: 'ai', name: 'AI', desc: 'Zona Drama AI — gelombang cerita pendek bertenaga AI dari melolo.' },
  { type: 'anime', name: 'Anime', desc: 'Konten anime / animasi — pantau terus rilisannya.' },
];

/* ============================================================
 * REELSHORT — pemetaan genre/kategori/karakter kita ke tag
 * ReelShort (reelshort.com/id). Kunci = nama ternormalisasi
 * (huruf kecil, tanpa simbol); nilai = nama tag PERSIS di
 * ReelShort (peka huruf besar/kecil, jalur /movie-genres/).
 * ============================================================ */

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Tag taksonomi BARU ReelShort (hanya beberapa yang tidak punya padanan lama). */
export interface RsNewTag {
  category: 'movie-identities' | 'story-beats' | 'mc-types' | 'movie-styles' | 'movie-themes';
  id: string;
  name: string;
}

export const RS_NEW_TAG_MAP: Record<string, RsNewTag> = {
  [norm('Petualangan')]: { category: 'story-beats', id: '676d210f4582b53a14081b17', name: 'Petualangan' },
  [norm('Alpha')]: { category: 'movie-identities', id: '676d210e4582b53a14081aa4', name: 'Alfa/Alpha' },
};

const RS_TAG_MAP_RAW: Record<string, string[]> = {
  // ---- genre (slug /genres/[slug]) ----
  billionaire: ['Miliarder'],
  ceo: ['CEO yang kasar', 'Pemilik Bisnis'],
  counterattack: ['Serangan Balik'],
  fantasy: ['Fantasi', 'Naga'],
  rebirth: ['Kelahiran kembali'],
  revenge: ['Membalas Dendam'],
  romance: ['Romansa', 'Romansa Manis'],
  suspense: ['Ketegangan', 'Misteri'],
  thriller: ['Cerita Seru', 'Kengerian'],
  urban: ['Kontemporer', 'Modern'],
  werewolf: ['manusia serigala'],
  vampire: ['vampir'],
  adventure: [],
  'sci-fi': ['Perjalanan Waktu', 'Kembali ke Masa Lalu'],

  // ---- KATEGORI_UTAMA ----
  Bangkit: ['Kembali'],
  'Time Travel': ['Perjalanan Waktu', 'Kembali ke Masa Lalu'],
  Sistem: [],
  'Kekuatan Super': ['Kekuatan Super', 'Prajurit Super'],
  Reinkarnasi: ['Kelahiran kembali'],
  'Identitas Tersembunyi': ['Identitas Tersembunyi', 'Banyak Identitas'],
  'Cinta Setelah Pernikahan': ['Cinta Setelah Menikah'],
  'Pembalasan Dendam': ['Membalas Dendam'],
  Keluarga: ['Keluarga', 'Drama Keluarga'],
  'Bayi Lucu': ['Bayi Jenius'],
  'Cinta Satu Malam': ['Malam Satu Cinta'],
  'Romansa Manis': ['Romansa Manis', 'Manis'],
  Harem: ['Harem'],
  'Cinta Terpendam': ['Perasaan Tersembunyi'],
  'Kembalinya Sang Kuat': ['Kembali', 'Prajurit Super'],
  'Keluarga Konglomerat': ['Pewaris/Sosialita', 'Miliarder'],
  'Mengejar Cinta Istri': ['Suami Pelindung', 'Cinta Setelah Menikah'],
  'Putri yang Tertukar': ['Identitas yang Salah', 'Tukar Tubuh'],
  'Dunia Kerja': ['Romantis di Kantor', 'Bisnis'],
  'Tak Terkalahkan': ['Prajurit Super', 'Kekuatan Super'],
  'Anak Kesayangan': ['Anak Hilang', 'Orang tua yang berkorban'],
  Komedi: ['Menyenangkan', 'Komedi Romantis'],
  Amnesia: ['Amnesia'],
  'Romansa Tragis': ['Cerita Sedih', 'Cinta Sedih', 'Sudah terlambat'],
  CLBK: ['Kesempatan kedua', 'Reuni'],
  'Cinta pada Pandangan Pertama': ['Cinta pada Pandangan Pertama'],
  Perselingkuhan: ['Perselingkuhan'],
  'Cinta Segitiga': ['Cinta segitiga'],
  Pedesaan: [],
  Kehamilan: ['Kehamilan'],
  'Kekasih Masa Kecil': ['Sayang Masa Kecil'],
  'Komedi Romantis': ['Komedi Romantis'],
  Kampus: ['Kampus', 'Romantis di Kampus'],
  'Dari Musuh Jadi Cinta': ['Musuh Bagi Kekasih', 'Cinta-Benci'],
  Kiamat: [],
  'Harem Terbalik': ['Membalikkan Harem'],
  'Pertukaran Jiwa': ['Tukar Tubuh'],
  Aksi: ['Pelaku Militer', 'Prajurit Super'],
  'Dunia Hiburan': ['Selebriti', 'Aktor/Aktris'],
  'Cinta Terlarang': ['Dilarang', 'Tabu'],
  'Pertukaran Tubuh': ['Tukar Tubuh'],

  // ---- KARAKTER_UTAMA ----
  CEO: ['CEO yang kasar', 'Pemilik Bisnis'],
  'Wanita Tangguh': ['Pahlawan Wanita yang Kuat', 'Wanita mandiri'],
  Sultan: ['Miliarder', 'Royalti/Bangsawan'],
  Dokter: ['Dokter', 'Dokter Bedah', 'Drama medis'],
  'Rakyat Jelata': ['Pelayan', 'Orang yang tidak dikenal'],
  'Keluarga Kerajaan': ['Royalti/Bangsawan', 'Politik Presiden & Kerajaan'],
  'Dewa Perang': ['Prajurit Super', 'Pelaku Militer'],
  Dewa: ['Abadi', 'Kekuatan Super'],
  Permaisuri: ['Royalti/Bangsawan'],
  Jenderal: ['Marsekal/Jenderal', 'Pelaku Militer'],
  Mafia: ['Mafia', 'Tuan Kejahatan', 'Dalang Kriminal'],
  Cinderella: ['Gadis yang tidak bersalah', 'Pelayan'],
  'Bad Boy': ['Playboy', 'Beracun'],
  Alpha: ['manusia serigala'],
  Serigala: ['manusia serigala'],
  Vampir: ['vampir'],
  Penyihir: [],
  Naga: ['Naga'],
};

/** Tag ReelShort (jalur lama) untuk nama genre/kategori/karakter kita. */
export function rsTagsFor(name: string): string[] {
  return RS_TAG_MAP_RAW[norm(name)] ?? RS_TAG_MAP_RAW[name] ?? [];
}

/** Tag ReelShort (taksonomi baru) bila tak ada padanan lama. */
export function rsNewTagFor(name: string): RsNewTag | null {
  return RS_NEW_TAG_MAP[norm(name)] ?? null;
}

/** Apakah nama punya pemetaan ReelShort sama sekali. */
export function hasRsMap(name: string): boolean {
  return rsTagsFor(name).length > 0 || !!rsNewTagFor(name);
}
