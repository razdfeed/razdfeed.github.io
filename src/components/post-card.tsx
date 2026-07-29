'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { DocsBody } from 'fumadocs-ui/layouts/docs/page';
import { SourcePopup } from '@/components/source-popup';
import { TelegramIcon } from '@/components/telegram-icon';
import { MediaImage } from '@/components/media-image';
import { MediaGallery } from '@/components/media-gallery';
import { LinkPreviewCard } from '@/components/link-preview-card';

interface FeedPostMedia {
  images: string[];
  videos: string[];
}

interface LinkPreview {
  url: string;
  image: string | null;
  siteName: string | null;
  title: string | null;
  description: string | null;
}

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
  sourceType: string;
  category: string;
  labels: string[];
  slug: string;
  media?: FeedPostMedia;
  linkPreview?: LinkPreview;
  forwardedFrom?: string | null;
  forwardedFromUrl?: string | null;
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
            <Link
              href={`/${post.authorLogin}/${post.slug}`}
              className="transition-colors hover:text-fd-primary"
            >
              {formatDate(post.createdAt)}
            </Link>
            {post.sourceType === 'telegram' ? (
              <TelegramIcon url={post.authorUrl || post.url} />
            ) : (
              <SourcePopup repo={post.sourceRepo || `/${post.authorLogin}`} />
            )}
          </span>
        </div>
      </header>

      {post.title && post.sourceType !== 'telegram' && (
        <Link href={`/${post.authorLogin}/${post.slug}`} className="group block">
          <h2 className="mb-3 text-xl font-semibold leading-snug transition-colors group-hover:text-fd-primary line-clamp-2">
            {post.title}
          </h2>
        </Link>
      )}

      {post.forwardedFrom && (
        <div className="mb-3 rounded-lg border border-fd-accent/40 bg-fd-accent/10 p-2.5 flex items-center gap-2 text-xs text-fd-muted-foreground">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-fd-accent">
            <path d="M15 14l5-5-5-5" /><path d="M20 9H9a4 4 0 0 0-4 4v1" />
          </svg>
          <span className="truncate">
            Перепост из{' '}
            {post.forwardedFromUrl ? (
              <a
                href={post.forwardedFromUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-fd-foreground transition-colors hover:text-fd-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {post.forwardedFrom}
              </a>
            ) : (
              <span className="font-medium text-fd-foreground">{post.forwardedFrom}</span>
            )}
          </span>
        </div>
      )}

      {post.media && post.media.images.length > 0 && (
        <div className="mb-4 group/gallery">
          {post.media.images.length === 1 ? (
            <MediaImage src={post.media.images[0]} />
          ) : (
            <MediaGallery images={post.media.images} alt={post.title || post.authorLogin} />
          )}
        </div>
      )}
      {post.media && post.media.videos.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {post.media.videos.slice(0, 2).map((src, i) => (
              <video
                key={i}
                src={src}
                controls
                preload="metadata"
                className="rounded-lg w-full"
                style={{ maxHeight: '490px' }}
              />
          ))}
        </div>
      )}

      {post.linkPreview && (
        <LinkPreviewCard preview={post.linkPreview} />
      )}

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
          className="mt-4 flex cursor-pointer items-center text-sm font-semibold text-[#217aff] transition-colors hover:text-[#217aff]/80"
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

      {post.sourceType === 'telegram' && post.url && (
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#e3f2fd] px-3 py-1.5 text-sm font-medium text-[#2b6cb0] transition-all duration-500 ease-in-out hover:bg-[#bbdefb] dark:bg-[#17212b] dark:text-[#8ab4de] dark:hover:bg-[#1e2b3a] ${expanded ? 'translate-y-0 opacity-100' : 'pointer-events-none absolute translate-y-2 opacity-0'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" className="text-[#3390ec]">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.467.143a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.008-.033.015-.154-.058-.218s-.185-.043-.265-.025c-.113.025-1.932 1.226-5.454 3.6-.516.354-.983.527-1.4.518-.462-.01-1.35-.26-2.011-.475-.812-.263-1.456-.404-1.397-.858.029-.234.362-.474 1-.72 3.916-1.706 6.526-2.833 7.832-3.378 3.726-1.55 4.5-1.819 5.002-1.827z" />
          </svg>
          @{post.authorLogin}
        </a>
      )}
    </article>
  );
}