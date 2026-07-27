'use client';

import { useEffect, useRef } from 'react';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { BaseLayoutProps, LinkItemType } from 'fumadocs-ui/layouts/shared';
import type { Root as PageTreeRoot } from 'fumadocs-core/page-tree';
import { Users, Rss, Plug } from 'lucide-react';
import { LogoTitle } from '@/components/logo-title';

interface HomeDocsLayoutProps {
  tree: PageTreeRoot;
  baseOptions: BaseLayoutProps;
  children: React.ReactNode;
}

const navLinks: LinkItemType[] = [
  {
    type: 'main',
    url: '/',
    text: 'Фид',
    icon: <Rss size={16} />,
    on: 'menu',
    active: 'url',
  },
  {
    type: 'main',
    url: '/authors',
    text: 'Авторы',
    icon: <Users size={16} />,
    on: 'menu',
    active: 'url',
  },
  {
    type: 'main',
    url: '/docs/connect',
    text: 'Как подключиться?',
    icon: <Plug size={16} />,
    on: 'menu',
    active: 'url',
  },
];

const emptyTree: PageTreeRoot = {
  name: 'home',
  children: [],
};

export function HomeDocsLayout({ tree: _tree, baseOptions, children }: HomeDocsLayoutProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    function getSidebarViewport(): HTMLElement | null {
      if (!root) return null;
      const sidebar = root.querySelector('#nd-sidebar');
      if (!sidebar) return null;
      return sidebar.querySelector('[style*="overflow: scroll"]') as HTMLElement | null;
    }

    function getSidebar(): HTMLElement | null {
      if (!root) return null;
      return root.querySelector('#nd-sidebar') as HTMLElement | null;
    }

    function onWheel(e: WheelEvent) {
      const sidebar = getSidebar();
      if (!sidebar || !sidebar.contains(e.target as Node)) return;

      const viewport = getSidebarViewport();
      if (!viewport) return;

      const delta = e.deltaY;
      const atBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 1;
      const atTop = viewport.scrollTop <= 0;

      const scrollingDown = delta > 0;
      const scrollingUp = delta < 0;

      const sidebarCanScrollDown = !atBottom;
      const sidebarCanScrollUp = !atTop;

      if (scrollingDown && sidebarCanScrollDown) return;
      if (scrollingUp && sidebarCanScrollUp) return;

      const pageCanScrollUp = window.scrollY > 0;
      const pageCanScrollDown = window.scrollY + window.innerHeight < document.documentElement.scrollHeight - 1;

      if (scrollingDown && !pageCanScrollDown) return;
      if (scrollingUp && !pageCanScrollUp) return;

      e.preventDefault();
      window.scrollBy({ top: delta, behavior: 'auto' });
    }

    root.addEventListener('wheel', onWheel, { passive: false });
    return () => root.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <div ref={rootRef} className="contents">
      <DocsLayout
        tree={emptyTree}
        {...baseOptions}
        links={navLinks}
        nav={{ ...baseOptions.nav, enabled: true, title: <LogoTitle /> }}
        sidebar={{ enabled: true, collapsible: true, footer: null, banner: null }}
        themeSwitch={{ enabled: true, mode: 'light-dark-system' }}
      >
        {children}
      </DocsLayout>
    </div>
  );
}