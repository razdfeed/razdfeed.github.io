'use client';

import { useState } from 'react';
import Link from 'next/link';
import { extractPreviewImage, extractPlainText, formatDate } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/markdown-renderer';

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
  const [expanded, setExpanded] = useState(false);
  const preview = extractPreviewImage(post.body);
  const excerpt = extractPlainText(post.body, 180);
  const avatar = author?.avatar ?? post.authorAvatar;
  const name = author?.name ?? post.authorName ?? post.authorLogin;
  const profileUrl = author?.htmlUrl ?? post.authorUrl;

  console.debug('[PostCard] render:', post.slug, 'preview:', preview ? 'yes' : 'no');

  return (
    <article className="rounded-lg border bg-fd-card p-4 shadow-sm transition-colors hover:bg-fd-accent/40">
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
            className="text-sm font-medium transition-colors hover:text-fd-primary"
            onClick={(e) => e.stopPropagation()}
          >
            {name}
          </a>
          <span className="text-xs text-fd-muted-foreground">{formatDate(post.createdAt)}</span>
        </div>
      </header>

      <Link href={`/${post.authorLogin}/${post.slug}`} className="group block">
        <h2 className="mb-3 text-xl font-semibold leading-snug transition-colors group-hover:text-fd-primary line-clamp-2">
          {post.title}
        </h2>
      </Link>

      {!expanded && preview ? (
        <div className="mb-4 aspect-video w-full overflow-hidden rounded-lg">
          <img
            src={preview}
            alt={post.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}

      <div className="space-y-4">
        <div
          className={
            `overflow-hidden transition-all duration-500 ease-in-out ` +
            (expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0')
          }
        >
          <article className="prose prose-fd max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-pre:rounded-lg prose-pre:bg-fd-muted/50 prose-img:rounded-lg">
            <MarkdownRenderer content={post.body} />
          </article>
        </div>

        {!expanded && excerpt ? (
          <p className="text-sm text-fd-muted-foreground line-clamp-3">{excerpt}</p>
        ) : null}

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center text-sm text-fd-primary transition-colors hover:text-fd-primary/80"
        >
          {expanded ? 'Скрыть' : 'Показать полностью'}
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
            className={`ml-1 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
    </article>
  );
}
