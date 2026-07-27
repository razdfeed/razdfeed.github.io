'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { DocsPage, DocsBody, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { TOCProvider, TOCPopover, TOC } from 'fumadocs-ui/layouts/docs/page/slots/toc';
import { baseOptions } from '@/lib/layout.shared';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { PostCard } from '@/components/post-card';
import { SidebarNav } from '@/components/sidebar-nav';
import { HomeContainer } from '@/components/home-container';
import { HomeTOC } from '@/components/home-toc';
import { extractTOC } from '@/lib/extract-toc';
import { SkeletonCard, SkeletonSidebar, SkeletonAuthorRow, SkeletonAuthorPage, SkeletonBlogPost } from '@/components/skeleton-card';
import { GiscusComments, type GiscusConfig } from '@/components/giscus-comments';
import { TelegramComments } from '@/components/telegram-comments';
import { LinkPreviewCard } from '@/components/link-preview-card';
import { SourcePopup } from '@/components/source-popup';
import { TelegramIcon } from '@/components/telegram-icon';
import { MediaImage } from '@/components/media-image';
import { MediaGallery } from '@/components/media-gallery';

/**
 * razdfeed frontend — reads data from the fetcher-collector GitHub Pages site.
 *
 * Data API (see https://razdfeed.github.io/fetcher-collector/ for the cheat sheet):
 *   GET {DATA_BASE}/authors.json   → { count, authors[] }
 *   GET {DATA_BASE}/posts-{n}.json → { page, totalPosts, totalPages, nextPage, posts[] }
 *
 * Every post carries authorLogin + authorName + authorAvatar, so we can build
 * author pages and post pages from the global feed without per-author files.
 */

import {
  fetchJson,
  fetchAllPosts,
  fetchAuthors,
  findAuthor,
  type FeedPost,
  type AuthorEntry,
} from '@/lib/data';

/** Fetch a single page of posts. Returns null on error. */
async function fetchPostsPage(
  path: string,
): Promise<{ posts: FeedPost[]; nextPage: string | null } | null> {
  const page = await fetchJson<{ posts: FeedPost[]; nextPage: string | null }>(path);
  if (!page) return null;
  return { posts: page.posts, nextPage: page.nextPage };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getPathSegments(): string[] {
  if (typeof window === 'undefined') return [];
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  const path = window.location.pathname.replace(base, '');
  return path.split('/').filter(Boolean);
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const isCurrentYear = date.getFullYear() === now.getFullYear();

  return date.toLocaleDateString('ru-RU', {
    year: isCurrentYear ? undefined : 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ── Home page: three-column feed layout ───────────────────────────────────

export function HomePageClient() {
  const PAGE_SIZE = 15;
  const [authors, setAuthors] = useState<AuthorEntry[]>([]);
  const [allPosts, setAllPosts] = useState<FeedPost[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [nextPage, setNextPage] = useState<string | null>('posts-1.json');
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [error, setError] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function load() {
      setError(false);
      setLoadingInitial(true);
      const [a, firstPage] = await Promise.all([
        fetchAuthors(),
        fetchPostsPage('posts-1.json'),
      ]);
      if (firstPage) {
        setAllPosts(firstPage.posts);
        setNextPage(firstPage.nextPage);
      } else {
        setError(true);
      }
      setAuthors(a);
      setChecked(true);
      setLoadingInitial(false);
    }
    load();
  }, []);

  async function loadMore() {
    if (loadingMore) return;

    if (visibleCount < allPosts.length) {
      setVisibleCount((c) => Math.min(c + PAGE_SIZE, allPosts.length));
      return;
    }

    if (!nextPage) return;
    setLoadingMore(true);
    const result = await fetchPostsPage(nextPage);
    if (result) {
      setAllPosts((prev) => [...prev, ...result.posts]);
      setNextPage(result.nextPage);
      setVisibleCount((c) => c + PAGE_SIZE);
    } else {
      setNextPage(null);
    }
    setLoadingMore(false);
  }

  const hasMore = visibleCount < allPosts.length || !!nextPage;
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: '400px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, allPosts.length, visibleCount, nextPage]);

  return (
    <DocsPage
      full
      breadcrumb={{ enabled: false }}
      footer={{ enabled: false }}
      tableOfContent={{ enabled: true }}
      tableOfContentPopover={{ enabled: false }}
      slots={{
        container: HomeContainer,
        toc: {
          provider: TOCProvider,
          main: () => <HomeTOC authors={authors} />,
          popover: TOCPopover,
        },
      }}
    >
      {!checked ? null : error && allPosts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-fd-muted-foreground">Не удалось загрузить ленту.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm text-fd-primary transition-colors hover:text-fd-primary/80"
          >
            Повторить
          </button>
        </div>
      ) : allPosts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-fd-muted-foreground">Пока нет постов.</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-fd-border">
            {allPosts.slice(0, visibleCount).map((post) => (
              <PostCard
                key={`${post.authorLogin}-${post.slug}`}
                post={post}
                author={findAuthor(authors, post.authorLogin)}
              />
            ))}
          </div>

          {(loadingMore || hasMore) && (
            <div
              ref={sentinelRef}
              className="flex justify-center py-8"
            >
              {loadingMore ? (
                <Loader2 className="h-6 w-6 animate-spin text-fd-primary" />
              ) : (
                <button
                  onClick={loadMore}
                  className="cursor-pointer rounded-lg border border-fd-border bg-fd-secondary px-6 py-2.5 text-sm font-medium text-fd-foreground shadow-sm transition-all duration-200 hover:bg-fd-accent hover:text-fd-accent-foreground hover:shadow-md active:scale-95 active:bg-fd-accent"
                >
                  Показать ещё
                </button>
              )}
            </div>
          )}
        </>
      )}
    </DocsPage>
  );
}

// ── Authors listing page ─────────────────────────────────────────────────────

export function AuthorsPageClient() {
  const [authors, setAuthors] = useState<AuthorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(false);
      console.debug('[AuthorsPageClient] loading authors');
      const a = await fetchAuthors();
      console.debug('[AuthorsPageClient] authors loaded:', a.length);
      if (a.length === 0) {
        console.warn('[AuthorsPageClient] no authors returned');
        setError(true);
      }
      setAuthors(a);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    console.debug('[AuthorsPageClient] skeleton rendered');
    return (
      <DocsPage
        full
        breadcrumb={{ enabled: false }}
        footer={{ enabled: false }}
        tableOfContent={{ enabled: false }}
        tableOfContentPopover={{ enabled: false }}
        slots={{ container: HomeContainer }}
      >
        <h1 className="text-[1.75em] font-semibold mb-6">Авторы</h1>
        <div className="space-y-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonAuthorRow key={i} />
          ))}
        </div>
      </DocsPage>
    );
  }

  if (error || authors.length === 0) {
    return (
      <DocsPage
        full
        breadcrumb={{ enabled: false }}
        footer={{ enabled: false }}
        tableOfContent={{ enabled: false }}
        tableOfContentPopover={{ enabled: false }}
        slots={{ container: HomeContainer }}
      >
        <h1 className="text-[1.75em] font-semibold mb-6">Авторы</h1>
        <p className="text-fd-muted-foreground">Не удалось загрузить список авторов.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm text-fd-primary transition-colors hover:text-fd-primary/80"
        >
          Повторить
        </button>
      </DocsPage>
    );
  }

  return (
    <DocsPage
      full
      breadcrumb={{ enabled: false }}
      footer={{ enabled: false }}
      tableOfContent={{ enabled: false }}
      tableOfContentPopover={{ enabled: false }}
      slots={{ container: HomeContainer }}
    >
      <h1 className="text-[1.75em] font-semibold mb-2">Авторы</h1>
      <p className="text-fd-muted-foreground mb-6">
        Всего авторов: {authors.length}
      </p>
      <ul className="space-y-4">
        {authors.map((a) => (
          <li key={a.login} className="flex items-center gap-3">
            {a.avatar && (
              <img
                src={a.avatar}
                alt={a.login}
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
            <div>
              <Link href={`/${a.login}`} className="font-medium transition-colors hover:text-fd-primary">
                {a.name}
              </Link>
              <p className="text-sm text-fd-muted-foreground">
                {a.postCount} постов
                {a.description ? ` · ${a.description}` : ''}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </DocsPage>
  );
}

// ── Author page ─────────────────────────────────────────────────────────────

function EmptyTOC() {
  return (
    <div id="nd-toc" className="sticky top-(--fd-docs-row-1) h-[calc(var(--fd-docs-height)-var(--fd-docs-row-1))] [grid-area:toc] w-(--fd-toc-width) pt-12 pe-4 pb-2 xl:layout:[--fd-toc-width:268px] max-xl:hidden" />
  );
}

export function AuthorPageClient() {
  const PAGE_SIZE = 15;
  const [segments, setSegments] = useState<string[]>(getPathSegments());

  useEffect(() => {
    setSegments(getPathSegments());
  }, []);

  const author = segments[0] ?? '';

  const [authorEntry, setAuthorEntry] = useState<AuthorEntry | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [notFound, setNotFound] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!author) return;
    async function load() {
      const [allAuthors, allPosts] = await Promise.all([
        fetchAuthors(),
        fetchAllPosts(),
      ]);
      const entry = findAuthor(allAuthors, author);
      const authorPosts = allPosts.filter((p) => p.authorLogin === author);
      if (!entry && authorPosts.length === 0) {
        setNotFound(true);
      } else {
        setAuthorEntry(entry);
        setPosts(authorPosts);
      }
      setChecked(true);
    }
    load();
  }, [author]);

  const hasMore = visibleCount < posts.length;
  const authorSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore) return;
    const el = authorSentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => c + PAGE_SIZE);
        }
      },
      { rootMargin: '400px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, posts.length, visibleCount]);

  const avatar = authorEntry?.avatar ?? posts[0]?.authorAvatar ?? '';
  const displayName = authorEntry?.name ?? posts[0]?.authorName ?? author;
  const bio = authorEntry?.bio ?? null;
  const htmlUrl = authorEntry?.htmlUrl ?? `https://github.com/${author}`;

  return (
    <DocsPage
      full
      breadcrumb={{ enabled: false }}
      footer={{ enabled: false }}
      tableOfContent={{ enabled: true }}
      tableOfContentPopover={{ enabled: false }}
      toc={[]}
      slots={{
        container: HomeContainer,
        toc: {
          provider: TOCProvider,
          main: EmptyTOC,
          popover: TOCPopover,
        },
      }}
    >
      {!checked ? null : notFound ? (
        <div className="py-12">
          <p className="text-fd-muted-foreground">Автор не найден или блог не настроен.</p>
          <Link href="/" className="text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground">
            ← На главную
          </Link>
        </div>
      ) : (
        <>
          <header className="mb-8 flex items-center gap-4 border-b pb-6">
            {avatar && (
              <img src={avatar} alt={author} width={64} height={64} className="rounded-full" />
            )}
            <div>
              <DocsTitle>{displayName}</DocsTitle>
              {bio && <p className="text-fd-muted-foreground">{bio}</p>}
              <a
                href={htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground"
              >
                @{author}
              </a>
            </div>
          </header>

          <div className="divide-y divide-fd-border">
            {posts.length === 0 ? (
              <p className="py-6 text-fd-muted-foreground">Пока нет постов.</p>
            ) : (
              posts.slice(0, visibleCount).map((post) => (
                <PostCard
                  key={`${post.authorLogin}-${post.slug}`}
                  post={post}
                  author={authorEntry}
                />
              ))
            )}
          </div>

          {hasMore && (
            <div
              ref={authorSentinelRef}
              className="flex justify-center py-8"
            >
              <Loader2 className="h-6 w-6 animate-spin text-fd-primary" />
            </div>
          )}
        </>
      )}
    </DocsPage>
  );
}

// ── Blog post page ──────────────────────────────────────────────────────────

interface BlogPostClientProps {
  giscusConfig?: GiscusConfig | null;
}

export function BlogPostClient({ giscusConfig }: BlogPostClientProps) {
  const [segments, setSegments] = useState<string[]>(getPathSegments());

  useEffect(() => {
    setSegments(getPathSegments());
  }, []);

  const author = segments[0] ?? '';
  const slug = segments[1] ?? '';

  const [post, setPost] = useState<FeedPost | null>(null);
  const [authorEntry, setAuthorEntry] = useState<AuthorEntry | null>(null);
  const [authors, setAuthors] = useState<AuthorEntry[]>([]);
  const [notFoundPost, setNotFoundPost] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!author || !slug) return;
    async function load() {
      const [allAuthors, allPosts] = await Promise.all([
        fetchAuthors(),
        fetchAllPosts(),
      ]);
      setAuthors(allAuthors);
      setAuthorEntry(findAuthor(allAuthors, author));
      const found = allPosts.find(
        (p) => p.authorLogin === author && p.slug === slug,
      );
      if (!found) {
        setNotFoundPost(true);
      } else {
        setPost(found);
      }
      setChecked(true);
    }
    load();
  }, [author, slug]);

  const tocItems = post ? extractTOC(post.body) : [];

  return (
    <DocsPage
      full
      breadcrumb={{ enabled: false }}
      footer={{ enabled: false }}
      tableOfContent={{ enabled: true }}
      tableOfContentPopover={{ enabled: true }}
      toc={tocItems}
      slots={{
        container: HomeContainer,
        toc: {
          provider: TOCProvider,
          main: TOC,
          popover: TOCPopover,
        },
      }}
    >
      {!checked ? null : notFoundPost || !post ? (
        <div className="py-12">
          <p className="text-fd-muted-foreground">Пост не найден.</p>
          <Link href={`/${author}`} className="text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground">
            ← {authorEntry?.name ?? author}
          </Link>
        </div>
      ) : (
        <>
          <DocsTitle>{post.title}</DocsTitle>

          <div className="mb-4 flex items-center gap-3 border-b pb-6">
            {post.authorAvatar && (
              <img
                src={post.authorAvatar}
                alt={author}
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
            <div className="text-sm text-fd-muted-foreground">
              <Link
                href={`/${author}`}
                className="font-medium transition-colors hover:text-fd-primary"
              >
                {post.authorName ?? author}
              </Link>
              {' · '}
              {formatDate(post.createdAt)}
              {' · '}
              {post.sourceType === 'telegram' ? (
                <TelegramIcon url={post.authorUrl || post.url} />
              ) : (
                <SourcePopup repo={post.sourceRepo || `/${author}`} />
              )}
            </div>
          </div>
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
                  >
                    {post.forwardedFrom}
                  </a>
                ) : (
                  <span className="font-medium text-fd-foreground">{post.forwardedFrom}</span>
                )}
              </span>
            </div>
          )}

          <DocsBody>
            {post.media && post.media.images.length > 0 && (
              <div className="mb-4 group/gallery">
                {post.media.images.length === 1 ? (
                  <MediaImage src={post.media.images[0]} />
                ) : (
                  <MediaGallery images={post.media.images} alt={post.title || post.author} />
                )}
              </div>
            )}
            {post.media && post.media.videos.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {post.media.videos.map((src, i) => (
                  <video key={i} src={src} controls preload="metadata" className="rounded-lg w-full" style={{ maxHeight: '490px' }} />
                ))}
              </div>
            )}
            {post.linkPreview && (
              <LinkPreviewCard preview={post.linkPreview} />
            )}
            <MarkdownRenderer content={post.body} />
          </DocsBody>

          <footer className="mt-12 border-t pt-6">
            <Link href={`/${author}`} className="text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground">
              ← {authorEntry?.name ?? post.authorName ?? author}
            </Link>
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground"
            >
              {post.sourceType === 'telegram' ? 'Открыть в Telegram →' : 'Обсудить на GitHub →'}
            </a>
          </footer>

          {post.sourceType === 'telegram' ? (
            <TelegramComments channel={post.author} postId={post.number} />
          ) : (
            <GiscusComments config={giscusConfig ?? null} term={post.number.toString()} />
          )}
        </>
      )}
    </DocsPage>
  );
}
