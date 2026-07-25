'use client';

import { useEffect, useState } from 'react';
import { AuthorPageClient, BlogPostClient } from '@/components/blog-client';

function getPathSegments(): string[] {
  if (typeof window === 'undefined') return [];
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  const path = window.location.pathname.replace(base, '');
  return path.split('/').filter(Boolean);
}

export function DynamicRoute() {
  const [segments, setSegments] = useState<string[] | null>(null);

  useEffect(() => {
    setSegments(getPathSegments());
  }, []);

  if (segments === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-fd-muted-foreground">Загрузка…</p>
      </div>
    );
  }

  if (segments.length <= 1) {
    return <AuthorPageClient key="author" />;
  }

  return <BlogPostClient key="post" />;
}