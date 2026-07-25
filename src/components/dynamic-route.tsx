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
    return <AuthorPageClient />;
  }

  if (segments.length <= 1) {
    return <AuthorPageClient />;
  }

  return <BlogPostClient />;
}