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

    function findScrollContainers(el: HTMLElement): { sidebar: HTMLElement | null; main: HTMLElement | null } {
      let node: HTMLElement | null = el;
      let sidebar: HTMLElement | null = null;
      let main: HTMLElement | null = null;

      while (node) {
        const style = getComputedStyle(node);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          const rect = node.getBoundingClientRect();
          if (rect.left < 200 && !sidebar) {
            sidebar = node;
          } else if (!main) {
            main = node;
          }
        }
        node = node.parentElement;
      }
      return { sidebar, main };
    }

    function onWheel(e: WheelEvent) {
      const { sidebar, main } = findScrollContainers(e.target as HTMLElement);
      if (!sidebar || !main) return;

      const sidebarEl = sidebar;
      const mainEl = main;

      const atBottom = sidebarEl.scrollTop + sidebarEl.clientHeight >= sidebarEl.scrollHeight - 2;
      const atTop = sidebarEl.scrollTop <= 0;

      if (e.deltaY > 0 && atBottom) {
        e.preventDefault();
        mainEl.scrollBy({ top: e.deltaY, behavior: 'auto' });
      } else if (e.deltaY < 0 && atTop && mainEl.scrollTop > 0) {
        e.preventDefault();
        mainEl.scrollBy({ top: e.deltaY, behavior: 'auto' });
      }
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
        nav={{ ...baseOptions.nav, enabled: true, visible: true, title: <LogoTitle /> }}
        sidebar={{ enabled: true, collapsible: true, footer: null, banner: null }}
        themeSwitch={{ enabled: true, mode: 'light-dark-system' }}
      >
        {children}
      </DocsLayout>
    </div>
  );
}