'use client';

import { Newspaper, Users, Info, Shield } from 'lucide-react';

export function SkeletonCard() {
  console.debug('[SkeletonCard] render');
  return (
    <article className="py-6 w-full min-w-0">
      <header className="mb-3 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full skeleton-shimmer shrink-0" />
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="h-4 w-32 rounded skeleton-shimmer" />
          <div className="h-3 w-20 rounded skeleton-shimmer" />
        </div>
      </header>
      <div className="mb-4">
        <div className="h-6 w-3/4 rounded skeleton-shimmer" />
      </div>
      <div className="mb-4 aspect-video w-full overflow-hidden rounded-lg">
        <div className="h-full w-full skeleton-shimmer" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full rounded skeleton-shimmer" />
        <div className="h-4 w-5/6 rounded skeleton-shimmer" />
        <div className="h-4 w-4/5 rounded skeleton-shimmer" />
      </div>
    </article>
  );
}

export function SkeletonSidebar() {
  console.debug('[SkeletonSidebar] render');
  const icons = [Newspaper, Users, Info, Shield];
  return (
    <nav className="flex w-full flex-col gap-1 md:w-60">
      {icons.map((Icon, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-md px-3 py-2"
        >
          <Icon size={18} className="text-fd-muted-foreground opacity-50" />
          <div className="h-4 w-24 rounded skeleton-shimmer" />
        </div>
      ))}
    </nav>
  );
}

export function SkeletonAuthorRow() {
  console.debug('[SkeletonAuthorRow] render');
  return (
    <div className="flex items-center gap-3 w-full min-w-0">
      <div className="h-10 w-10 rounded-full skeleton-shimmer shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-4 w-1/3 min-w-[120px] rounded skeleton-shimmer" />
        <div className="h-3 w-1/2 min-w-[80px] rounded skeleton-shimmer" />
      </div>
    </div>
  );
}

export function SkeletonAuthorPage() {
  console.debug('[SkeletonAuthorPage] render');
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <header className="mb-12 flex items-center gap-4">
        <div className="h-16 w-16 rounded-full skeleton-shimmer shrink-0" />
        <div className="flex flex-col gap-2">
          <div className="h-7 w-48 rounded skeleton-shimmer" />
          <div className="h-4 w-32 rounded skeleton-shimmer" />
          <div className="h-3 w-24 rounded skeleton-shimmer" />
        </div>
      </header>
      <section>
        <div className="mb-6 h-6 w-32 rounded skeleton-shimmer" />
        <ul className="space-y-6">
          {[0, 1, 2, 3].map((i) => (
            <li key={i}>
              <div className="h-5 w-3/4 rounded skeleton-shimmer" />
              <div className="mt-1 h-3 w-1/4 rounded skeleton-shimmer" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function SkeletonBlogPost() {
  console.debug('[SkeletonBlogPost] render');
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 h-4 w-32 rounded skeleton-shimmer" />
      <header className="mb-8 border-b pb-6">
        <div className="h-9 w-3/4 rounded skeleton-shimmer" />
        <div className="mt-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full skeleton-shimmer shrink-0" />
          <div className="h-4 w-40 rounded skeleton-shimmer" />
        </div>
      </header>
      <article className="prose prose-fd max-w-none dark:prose-invert">
        <div className="space-y-4">
          <div className="h-4 w-full rounded skeleton-shimmer" />
          <div className="h-4 w-5/6 rounded skeleton-shimmer" />
          <div className="h-4 w-4/5 rounded skeleton-shimmer" />
          <div className="h-40 w-full rounded-lg skeleton-shimmer" />
          <div className="h-4 w-full rounded skeleton-shimmer" />
          <div className="h-4 w-3/4 rounded skeleton-shimmer" />
        </div>
      </article>
    </div>
  );
}