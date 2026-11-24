import type { Metadata } from 'next';

export const SITE_URL = 'https://dramaku-ubcc.vercel.app';

/**
 * Metadata Open Graph/Twitter seragam — kartu preview besar saat link
 * dibagikan ke WhatsApp/Telegram (gambar cover + judul + sinopsis).
 */
export function ogMeta(opts: {
  title: string;
  description?: string | null;
  /** path halaman, mis. `/series/xxx` */
  path: string;
  /** URL gambar cover (absolut) */
  image?: string | null;
}): Pick<Metadata, 'description' | 'openGraph' | 'twitter'> {
  const desc =
    (opts.description || '').replace(/\s+/g, ' ').trim().slice(0, 200) ||
    'Nonton drama pendek favoritmu di DramaKu — cepat, bersih, dan nyaman.';
  const images = opts.image ? [{ url: opts.image, alt: opts.title }] : [];
  return {
    description: desc,
    openGraph: {
      title: opts.title,
      description: desc,
      type: 'website',
      locale: 'id_ID',
      siteName: 'DramaKu',
      url: `${SITE_URL}${opts.path}`,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: desc,
      images: opts.image ? [opts.image] : [],
    },
  };
}
