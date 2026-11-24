import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import Footer from '@/components/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'DramaKu — Nonton Drama Pendek Online',
    template: '%s · DramaKu',
  },
  description:
    'Streaming drama pendek favoritmu: tonton, simpan, dan lanjutkan kapan saja. Cepat, bersih, dan nyaman.',
  keywords: ['drama', 'streaming', 'drama pendek', 'nonton online', 'DramaKu'],
  openGraph: {
    title: 'DramaKu — Nonton Drama Pendek Online',
    description: 'Streaming drama pendek favoritmu: tonton, simpan, dan lanjutkan kapan saja.',
    type: 'website',
    locale: 'id_ID',
    siteName: 'DramaKu',
  },
};

export const viewport: Viewport = {
  themeColor: '#08090a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const themeScript = `(function(){try{var t=localStorage.getItem('dramaku:theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-theme="dark" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
