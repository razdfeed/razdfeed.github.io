import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'RazdFeed — Посты от авторов из GitHub',
    template: '%s | RazdFeed',
  },
  description:
    'RazdFeed собирает посты авторов из GitHub Issues в одну ленту.',
  keywords: ['RazdFeed', 'GitHub', 'блог', 'разработка', 'посты', 'лента'],
  authors: [{ name: 'RazdFeed' }],
  creator: 'RazdFeed',
  publisher: 'RazdFeed',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'RazdFeed',
    title: 'RazdFeed — Посты от авторов из GitHub',
    description:
      'RazdFeed собирает посты авторов из GitHub Issues в одну ленту.',
    images: ['/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RazdFeed — Посты от авторов из GitHub',
    description:
      'RazdFeed собирает посты авторов из GitHub Issues в одну ленту.',
    images: ['/logo.png'],
  },
  icons: {
    icon: '/logo.png',
  },
  alternates: {
    canonical: 'https://razdfeed.github.io',
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ru" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider search={{ enabled: false }}>{children}</RootProvider>
      </body>
    </html>
  );
}
