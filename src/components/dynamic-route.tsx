'use client';

import { AuthorPageClient, BlogPostClient } from '@/components/blog-client';
import type { GiscusConfig } from '@/components/giscus-comments';

interface DynamicRouteProps {
  segments?: string[];
  giscusConfig?: GiscusConfig | null;
}

export function DynamicRoute({ segments, giscusConfig }: DynamicRouteProps) {
  if (!segments || segments.length <= 1) {
    return <AuthorPageClient key="author" segments={segments ?? []} />;
  }

  return <BlogPostClient key="post" segments={segments} giscusConfig={giscusConfig} />;
}
