'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Newspaper, Users, Info, Shield, Rss } from 'lucide-react';

const items = [
  { href: '/', label: 'Фид', icon: Rss },
  { href: '/authors', label: 'Авторы', icon: Users },
  { href: '/docs', label: 'О проекте', icon: Info },
  { href: '/docs/rules', label: 'Правила', icon: Shield },
];

export function SidebarNav() {
  const pathname = usePathname() ?? '/';
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  const active = pathname.replace(basePath, '') || '/';

  console.debug('[SidebarNav] active path:', active);

  return (
    <nav className="flex w-full flex-col gap-1 md:w-60">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ` +
              (isActive
                ? 'bg-fd-primary/10 text-fd-primary'
                : 'text-fd-foreground hover:bg-fd-accent')
            }
          >
            <Icon size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
