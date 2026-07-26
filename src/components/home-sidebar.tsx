'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Rss, Users, Info, Shield } from 'lucide-react';
import { SearchTrigger } from 'fumadocs-ui/layouts/shared/slots/search-trigger';
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch';
import { useSearchContext } from 'fumadocs-ui/contexts/search';

const items = [
  { href: '/', label: 'Фид', icon: Rss },
  { href: '/authors', label: 'Авторы', icon: Users },
  { href: '/docs', label: 'О проекте', icon: Info },
  { href: '/docs/rules', label: 'Правила', icon: Shield },
];

function SidebarSearch() {
  const ctx = useSearchContext();
  if (!ctx.enabled) return null;

  return (
    <button
      type="button"
      onClick={() => ctx.setOpenSearch(true)}
      className="flex w-full items-center justify-between gap-2 rounded-lg border bg-fd-secondary/50 px-3 py-2 text-sm text-fd-muted-foreground transition-colors hover:bg-fd-accent/50 hover:text-fd-accent-foreground"
    >
      <span className="flex items-center gap-2">
        <Search size={16} />
        Search
      </span>
      <kbd className="rounded border bg-fd-background px-1.5 py-0.5 text-xs font-mono">
        Ctrl K
      </kbd>
    </button>
  );
}

export function HomeSidebar() {
  const pathname = usePathname() ?? '/';
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  const active = pathname.replace(basePath, '') || '/';

  return (
    <aside className="flex h-full flex-col gap-3 p-4 pb-2">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <img src="/logo.png" alt="razdfeed" width={40} height={40} className="rounded" />
          <span className="text-[0.9375rem] font-medium">razdfeed</span>
        </Link>
      </div>

      <SidebarSearch />

      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                `relative flex flex-row items-center gap-2 rounded-lg p-2 text-start text-sm transition-colors ` +
                (isActive
                  ? 'bg-fd-primary/10 text-fd-primary'
                  : 'text-fd-muted-foreground hover:bg-fd-accent/50 hover:text-fd-accent-foreground')
              }
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center justify-between border-t pt-2">
        <ThemeSwitch mode="light-dark-system" />
      </div>
    </aside>
  );
}
