import { AuthorPageClient, BlogPostClient } from '@/components/blog-client';
import { DynamicRoute } from '@/components/dynamic-route';

export function generateStaticParams() {
  return [{ path: ['_author'] }, { path: ['_author', '_post'] }];
}

export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path } = await params;
  const segments = path ?? [];

  if (segments.length === 2) {
    return <BlogPostClient />;
  }

  if (segments.length === 1 && segments[0] === '_post') {
    return <DynamicRoute />;
  }

  return <AuthorPageClient />;
}