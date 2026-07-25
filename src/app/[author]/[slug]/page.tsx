import { getAuthorInfo, getBlogPost } from '@/lib/github';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MarkdownRenderer } from '@/components/markdown-renderer';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ author: string; slug: string }>;
}): Promise<Metadata> {
  const { author, slug } = await params;
  const post = await getBlogPost(author, slug);
  if (!post) return { title: 'Не найдено' };

  return {
    title: post.title,
    description: post.body.slice(0, 160),
  };
}

export async function generateStaticParams() {
  return [{ author: 'dealenx', slug: '1' }, { author: 'dealenx', slug: '2' }];
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ author: string; slug: string }>;
}) {
  const { author, slug } = await params;
  const [post, user] = await Promise.all([
    getBlogPost(author, slug),
    getAuthorInfo(author),
  ]);

  if (!post) notFound();

  const cleanBody = post.body
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<img[^>]*width="\d+"[^>]*height="\d+"[^>]*>/gi, (match) =>
      match.replace(/width="\d+"\s+height="\d+"/gi, ''),
    );

  return (
    <HomeLayout {...baseOptions()}>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <nav className="mb-8">
          <Link
            href={`/${author}`}
            className="text-sm text-fd-muted-foreground hover:underline"
          >
            ← {user?.name ?? author}
          </Link>
        </nav>

        <header className="mb-8 border-b pb-6">
          <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
          <div className="mt-4 flex items-center gap-3">
            {user?.avatarUrl && (
              <img
                src={user.avatarUrl}
                alt={author}
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
            <div className="text-sm text-fd-muted-foreground">
              <a
                href={user?.url ?? `https://github.com/${author}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                {user?.name ?? author}
              </a>
              {' · '}
              {new Date(post.createdAt).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
          {post.labels.length > 0 && (
            <div className="mt-3 flex gap-2">
              {post.labels.map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-fd-muted px-2 py-0.5 text-xs"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </header>

        <article className="prose prose-fd max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-pre:rounded-lg prose-pre:bg-fd-muted/50 prose-img:rounded-lg">
          <MarkdownRenderer content={cleanBody} />
        </article>

        <footer className="mt-12 border-t pt-6">
          <Link
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-fd-muted-foreground hover:underline"
          >
            Обсудить на GitHub →
          </Link>
        </footer>
      </div>
    </HomeLayout>
  );
}