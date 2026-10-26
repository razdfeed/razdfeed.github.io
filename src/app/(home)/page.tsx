import { HomePageClient } from '@/components/blog-client';
import { defaultOgImage } from '@/lib/shared';
import type { Metadata } from 'next';

const description =
  'Главная лента razdfeed — свежие посты разработчиков из GitHub Issues.';

export const metadata: Metadata = {
  title: 'Фид',
  description,
  openGraph: {
    title: 'Фид | razdfeed',
    description,
    images: [defaultOgImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Фид | razdfeed',
    description,
    images: [defaultOgImage],
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
