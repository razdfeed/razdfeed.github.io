'use client';

import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { BaseLayoutProps, LinkItemType } from 'fumadocs-ui/layouts/shared';
import type { Root as PageTreeRoot } from 'fumadocs-core/page-tree';
import { Users, Info, Shield, Rss } from 'lucide-react';

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
    url: '/docs',
    text: 'О проекте',
    icon: <Info size={16} />,
    on: 'menu',
    active: 'url',
  },
  {
    type: 'main',
    url: '/docs/rules',
    text: 'Правила',
    icon: <Shield size={16} />,
    on: 'menu',
    active: 'url',
  },
];

const emptyTree: PageTreeRoot = {
  name: 'home',
  children: [],
};

export function HomeDocsLayout({ tree: _tree, baseOptions, children }: HomeDocsLayoutProps) {
  return (
    <DocsLayout
      tree={emptyTree}
      {...baseOptions}
      links={navLinks}
      nav={{ ...baseOptions.nav, enabled: false }}
      sidebar={{ enabled: true, collapsible: true, footer: null, banner: null }}
    >
      {children}
    </DocsLayout>
  );
}