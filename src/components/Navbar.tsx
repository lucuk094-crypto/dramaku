'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import BackButton from './BackButton';
import { IconSearch, IconHeart, IconClock } from './Icons';

const links = [
  { href: '/', label: 'Beranda' },
  { href: '/jelajah', label: 'Jelajah' },
  { href: '/baru-tayang', label: 'Baru Tayang' },
  { href: '/genres', label: 'Genre' },
  { href: '/ranking', label: 'Peringkat' },
];

const isOn = (href: string, path: string) =>
  href === '/' ? path === '/' : path.startsWith(href);

export default function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* ============ bar desktop: back · logo · [tautan pusat] · aksi kanan ============ */}
      <header className="bar hidden md:block">
        <div className="shell">
          <BackButton compact className="shrink-0" />

          <Link href="/" className="logo focus-ring ml-1 rounded" aria-label="Beranda DramaKu">
            <i aria-hidden />
            <span className="logo-word">
              Drama<em>Ku</em>
            </span>
          </Link>

          <nav className="nav" aria-label="Navigasi utama">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={isOn(link.href, pathname) ? 'on' : ''}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="bar-right">
            <Link
              href="/search"
              className="icon-btn focus-ring"
              aria-label="Cari drama"
              title="Cari"
            >
              <IconSearch className="h-4 w-4" />
            </Link>
            <Link
              href="/favorites"
              className={`icon-btn focus-ring ${isOn('/favorites', pathname) ? 'on' : ''}`}
              aria-label="Favorit"
              title="Favorit"
            >
              <IconHeart className="h-4 w-4" />
            </Link>
            <Link
              href="/history"
              className={`icon-btn focus-ring ${isOn('/history', pathname) ? 'on' : ''}`}
              aria-label="Riwayat"
              title="Riwayat"
            >
              <IconClock className="h-4 w-4" />
            </Link>
            <span className="icon-sep" aria-hidden />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ============ bar mobile: back · logo · cari · tema ============ */}
      <header className="bar md:hidden">
        <div className="shell" style={{ height: 50 }}>
          <BackButton compact className="shrink-0" />

          <Link href="/" className="logo focus-ring ml-1 rounded" aria-label="Beranda DramaKu">
            <i aria-hidden />
            <span className="logo-word">
              Drama<em>Ku</em>
            </span>
          </Link>

          <div className="bar-right">
            <Link href="/search" className="icon-btn focus-ring" aria-label="Cari drama">
              <IconSearch className="h-4 w-4" />
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
    </>
  );
}
