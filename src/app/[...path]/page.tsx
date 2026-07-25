import { AuthorPageClient, BlogPostClient } from '@/components/blog-client';

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

  if (segments.length <= 1) {
    return <AuthorPageClient />;
  }

  return <BlogPostClient />;
}