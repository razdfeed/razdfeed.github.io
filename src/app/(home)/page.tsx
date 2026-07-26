import { HomePageClient } from '@/components/blog-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Фид',
  description:
    'Главная лента razdfeed — свежие посты разработчиков из GitHub Issues.',
  openGraph: {
    title: 'Фид | razdfeed',
    description:
      'Главная лента razdfeed — свежие посты разработчиков из GitHub Issues.',
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
