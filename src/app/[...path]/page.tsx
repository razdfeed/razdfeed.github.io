import { DynamicRoute } from '@/components/dynamic-route';
import { fetchAllPosts, fetchAuthors } from '@/lib/data';

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

export default async function Page() {
  return <DynamicRoute />;
}