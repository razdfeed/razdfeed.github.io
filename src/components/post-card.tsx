'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { DocsBody } from 'fumadocs-ui/layouts/docs/page';

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
  lazy?: boolean;
}

export function PostCard({ post, author, lazy = false }: PostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [previewHeight, setPreviewHeight] = useState(0);
  const [fullHeight, setFullHeight] = useState(0);
  const [visible, setVisible] = useState(!lazy);
  const [fadeIn, setFadeIn] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const avatar = author?.avatar ?? post.authorAvatar;
  const name = author?.name ?? post.authorName ?? post.authorLogin;
  const profileUrl = `/${post.authorLogin}`;

  useEffect(() => {
    if (!lazy || visible) return;
    const raf = requestAnimationFrame(() => {
      setVisible(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [lazy, visible]);

  useEffect(() => {
    if (visible) {
      const raf = requestAnimationFrame(() => setFadeIn(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [visible]);

  useLayoutEffect(() => {
    if (!contentRef.current) return;
    if (previewHeight > 0) return;

    const imgs = contentRef.current.querySelectorAll('img');
    const paragraphs = contentRef.current.querySelectorAll('p, h2, h3, ul, ol, blockquote, pre');

    let imgHeight = 0;
    let paraHeight = 0;

    if (imgs.length > 0) {
      const img = imgs[0];
      const imgRect = img.getBoundingClientRect();
      if (imgRect.height > 0) {
        imgHeight = imgRect.height + 16;
      } else {
        imgHeight = contentRef.current.offsetWidth * 0.5625 + 16;
      }
    }

    if (paragraphs.length > 0) {
      const first = paragraphs[0];
      const computed = window.getComputedStyle(first);
      const lineHeight = parseFloat(computed.lineHeight) || 24;
      const paddingTop = parseFloat(computed.paddingTop) || 0;
      const paddingBottom = parseFloat(computed.paddingBottom) || 0;
      const marginTop = parseFloat(computed.marginTop) || 0;
      const marginBottom = parseFloat(computed.marginBottom) || 0;
      paraHeight = lineHeight * 2 + paddingTop + paddingBottom + marginTop + marginBottom;
    }

    setPreviewHeight(imgHeight + paraHeight);
    setFullHeight(contentRef.current.scrollHeight);
  }, [post.body, previewHeight, visible]);

  useEffect(() => {
    if (!contentRef.current || !expanded) return;
    setFullHeight(contentRef.current.scrollHeight);
  }, [expanded]);

  console.debug('[PostCard] render:', post.slug, 'previewHeight:', previewHeight, 'fullHeight:', fullHeight);

  const maxHeight = expanded ? (fullHeight || 'none') : (previewHeight || 0);

  if (!visible) {
    return (
      <article className="py-6 w-full min-w-0">
        <header className="mb-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full skeleton-shimmer shrink-0" />
          <div className="flex flex-col gap-1">
            <div className="h-4 w-32 rounded skeleton-shimmer" />
            <div className="h-3 w-20 rounded skeleton-shimmer" />
          </div>
        </header>
        <div className="mb-4 h-6 w-3/4 rounded skeleton-shimmer" />
        <div className="aspect-video w-full rounded-lg skeleton-shimmer" />
      </article>
    );
  }

  return (
    <article className={`py-6 transition-opacity duration-500 ease-in-out ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
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
          <Link
            href={profileUrl}
            className="text-sm font-medium transition-colors hover:text-fd-primary"
            onClick={(e) => e.stopPropagation()}
          >
            {name}
          </Link>
          <span className="text-xs text-fd-muted-foreground inline-flex items-center gap-1">
            {formatDate(post.createdAt)}
            <span title="Опубликовано через GitHub" className="inline-flex items-center">
              <svg
                viewBox="0 0 24 24"
                width={12}
                height={12}
                fill="currentColor"
                className="text-fd-muted-foreground"
                aria-hidden="true"
              >
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            </span>
          </span>
        </div>
      </header>

      <Link href={`/${post.authorLogin}/${post.slug}`} className="group block">
        <h2 className="mb-3 text-xl font-semibold leading-snug transition-colors group-hover:text-fd-primary line-clamp-2">
          {post.title}
        </h2>
      </Link>

      <div
        style={{ maxHeight }}
        className={`relative overflow-hidden ${expanded ? 'transition-all duration-500 ease-in-out' : ''}`}
      >
        <div ref={contentRef}>
          <DocsBody>
            <MarkdownRenderer content={post.body} />
          </DocsBody>
        </div>
      </div>

      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-4 flex cursor-pointer items-center text-sm font-semibold text-fd-primary transition-colors hover:text-fd-primary/80"
        >
          Показать полностью
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-1 transition-transform duration-300"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      )}
    </article>
  );
}