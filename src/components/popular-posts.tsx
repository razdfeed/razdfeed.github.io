'use client';

import Link from 'next/link';
import { extractPlainText, formatDate } from '@/lib/utils';

interface FeedPost {
  number: number;
  title: string;
  body: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  authorUrl: string;
  authorAvatar: string;
  authorLogin: string;
  authorName: string | null;
  sourceRepo: string;
  category: string;
  labels: string[];
  slug: string;
}

interface PopularPostsProps {
  posts: FeedPost[];
  limit?: number;
}

export function PopularPosts({ posts, limit = 5 }: PopularPostsProps) {
  const sorted = [...posts]
    .filter((p) => new Date(p.createdAt).getTime() > 0)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  console.debug('[PopularPosts] count:', sorted.length);

  if (sorted.length === 0) return null;

  return (
    <aside className="w-full rounded-lg border bg-fd-card p-4 shadow-sm md:w-80">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-fd-muted-foreground">
        Популярные статьи
      </h3>
      <ul className="flex flex-col gap-4">
        {sorted.map((post) => {
          const excerpt = extractPlainText(post.body, 100);
          return (
            <li key={`${post.authorLogin}-${post.slug}`}>
              <Link
                href={`/${post.authorLogin}/${post.slug}`}
                className="group flex items-start gap-3"
              >
                {post.authorAvatar ? (
                  <img
                    src={post.authorAvatar}
                    alt={post.authorLogin}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-fd-muted" />
                )}
                <div className="flex-1">
                  <h4 className="text-sm font-medium leading-snug group-hover:underline line-clamp-2">
                    {post.title}
                  </h4>
                  {excerpt ? (
                    <p className="mt-1 text-xs text-fd-muted-foreground line-clamp-3">{excerpt}</p>
                  ) : null}
                  <span className="mt-1 block text-xs text-fd-muted-foreground">
                    {formatDate(post.createdAt)}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
