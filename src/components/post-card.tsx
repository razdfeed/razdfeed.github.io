'use client';

import Link from 'next/link';
import { extractPreviewImage, formatDate } from '@/lib/utils';

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

interface AuthorEntry {
  login: string;
  name: string;
  avatar: string;
  htmlUrl: string;
}

interface PostCardProps {
  post: FeedPost;
  author?: AuthorEntry | null;
}

export function PostCard({ post, author }: PostCardProps) {
  const preview = extractPreviewImage(post.body);
  const avatar = author?.avatar ?? post.authorAvatar;
  const name = author?.name ?? post.authorName ?? post.authorLogin;
  const profileUrl = author?.htmlUrl ?? post.authorUrl;

  console.debug('[PostCard] render:', post.slug, 'preview:', preview ? 'yes' : 'no');

  return (
    <article className="rounded-lg border bg-fd-card p-4 shadow-sm transition-colors hover:bg-fd-accent/40 min-h-[280px]">
      <header className="mb-3 flex items-center gap-3">
        {avatar ? (
          <img
            src={avatar}
            alt={post.authorLogin}
            width={36}
            height={36}
            className="rounded-full shrink-0"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-fd-muted shrink-0" />
        )}
        <div className="flex flex-col">
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {name}
          </a>
          <span className="text-xs text-fd-muted-foreground">{formatDate(post.createdAt)}</span>
        </div>
      </header>

      <Link href={`/${post.authorLogin}/${post.slug}`} className="group block">
        <h2 className="mb-3 text-xl font-semibold leading-snug group-hover:underline line-clamp-2">
          {post.title}
        </h2>

        {preview ? (
          <div className="mb-4 aspect-video w-full overflow-hidden rounded-lg">
            <img
              src={preview}
              alt={post.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : null}

        <div className="flex items-center text-sm text-fd-primary hover:underline">
          Показать полностью
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-1"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </Link>
    </article>
  );
}
