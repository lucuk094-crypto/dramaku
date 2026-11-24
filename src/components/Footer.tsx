import Link from 'next/link';

/** Footer instrumen — kolom legals mono, garis rambut, ritme 12px. */
export default function Footer() {
  return (
    <footer className="foot">
      <div className="shell">
        <div className="foot-top">
          <div>
            <Link href="/" className="logo focus-ring rounded">
              <i aria-hidden />
              <span className="logo-word">
                Drama<em>Ku</em>
              </span>
            </Link>
            <p>
              Nonton drama pendek favoritmu <b>kapan saja</b> — cepat, bersih, dan nyaman di mata.
            </p>
          </div>

          <div>
            <h4>Jelajahi</h4>
            <ul>
              <li><Link href="/">Beranda</Link></li>
              <li><Link href="/genres">Genre</Link></li>
              <li><Link href="/ranking">Peringkat</Link></li>
              <li><Link href="/search">Pencarian</Link></li>
            </ul>
          </div>

          <div>
            <h4>Koleksi</h4>
            <ul>
              <li><Link href="/favorites">Favorit</Link></li>
              <li><Link href="/history">Riwayat</Link></li>
              <li><Link href="/genres">Semua Genre</Link></li>
            </ul>
          </div>

          <div>
            <h4>Tentang</h4>
            <ul>
              <li>
                <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">
                  Dibangun dengan Next.js ↗
                </a>
              </li>
              <li>
                <Link href="/genres">Genre &amp; Kategori</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="legal">
          <p>© {new Date().getFullYear()} DramaKu — dibangun dengan Next.js</p>
          <p>
            Dikembangkan oleh <b className="mono-accent font-normal">Van313 | Official</b>
          </p>
          <p>Konten milik penyedianya masing-masing · Nikmati tontonannya di DramaKu</p>
        </div>
      </div>
    </footer>
  );
}
