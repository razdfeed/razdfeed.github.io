'use client';

import { AuthorPageClient, BlogPostClient } from '@/components/blog-client';

interface DynamicRouteProps {
  segments?: string[];
}

export function DynamicRoute({ segments }: DynamicRouteProps) {
  if (!segments || segments.length <= 1) {
    return <AuthorPageClient key="author" />;
  }

  return <BlogPostClient key="post" />;
}
