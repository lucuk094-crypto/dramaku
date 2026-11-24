'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconClock, IconHeart, IconHome, IconSearch, IconSpark } from './Icons';

const items = [
  { href: '/', label: 'Beranda', icon: IconHome },
  { href: '/search', label: 'Cari', icon: IconSearch },
  { href: '/jelajah', label: 'Jelajah', icon: IconSpark },
  { href: '/favorites', label: 'Favorit', icon: IconHeart },
  { href: '/history', label: 'Riwayat', icon: IconClock },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav md:hidden" aria-label="Navigasi bawah">
      <div className="flex h-[58px] items-stretch">
        {items.map((item) => {
          const on = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={`focus-ring ${on ? 'on' : ''}`}>
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
