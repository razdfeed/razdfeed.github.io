import { DynamicRoute } from '@/components/dynamic-route';
import { fetchAllPosts, fetchAuthors } from '@/lib/data';
import { fetchGiscusConfig } from '@/lib/giscus';
import type { GiscusConfig } from '@/components/giscus-comments';

export async function generateStaticParams() {
  const [authors, posts] = await Promise.all([
    fetchAuthors(),
    fetchAllPosts(),
  ]);

  const paths: { path: string[] }[] = [];

  for (const author of authors) {
    paths.push({ path: [author.login] });
  }

  for (const post of posts) {
    paths.push({ path: [post.authorLogin, post.slug] });
  }

  if (paths.length === 0) {
    paths.push({ path: ['_author'] }, { path: ['_author', '_post'] });
  }

  return paths;
}

interface PathPageProps {
  params: Promise<{ path?: string[] }>;
}

export default async function Page({ params }: PathPageProps) {
  const { path } = await params;
  const segments = path ?? [];

  let giscusConfig: GiscusConfig | null = null;
  if (segments.length >= 2) {
    const [authorLogin, slug] = segments;
    const posts = await fetchAllPosts();
    const post = posts.find(
      (p) => p.authorLogin === authorLogin && p.slug === slug,
    );
    if (post?.sourceRepo) {
      giscusConfig = await fetchGiscusConfig(post.sourceRepo);
    }
  }

  return <DynamicRoute segments={segments} giscusConfig={giscusConfig} />;
}
