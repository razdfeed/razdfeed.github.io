'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
  return new Date(iso).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ── Home page: three-column feed layout ───────────────────────────────────

export function HomePageClient() {
  const [authors, setAuthors] = useState<AuthorEntry[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [nextPage, setNextPage] = useState<string | null>('posts-1.json');
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function load() {
      setError(false);
      console.debug('[HomePageClient] initial load');
      const [a, firstPage] = await Promise.all([
        fetchAuthors(),
        fetchPostsPage('posts-1.json'),
      ]);
      console.debug('[HomePageClient] authors loaded:', a.length);
      if (firstPage) {
        console.debug('[HomePageClient] posts loaded:', firstPage.posts.length);
        setPosts(firstPage.posts);
        setNextPage(firstPage.nextPage);
      } else {
        console.warn('[HomePageClient] fetch error: first page is null');
        setError(true);
      }
      setAuthors(a);
      setChecked(true);
    }
    load();
  }, []);

  async function loadMore() {
    if (!nextPage || loadingMore) return;
    setLoadingMore(true);
    console.debug('[HomePageClient] loading more, nextPage:', nextPage);
    const result = await fetchPostsPage(nextPage);
    if (result) {
      setPosts((prev) => [...prev, ...result.posts]);
      setNextPage(result.nextPage);
      console.debug('[HomePageClient] loaded more:', result.posts.length);
    } else {
      console.warn('[HomePageClient] fetch error: more page is null');
      setNextPage(null);
    }
    setLoadingMore(false);
  }

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
      {!checked ? null : error && posts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-fd-muted-foreground">Не удалось загрузить ленту.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm text-fd-primary transition-colors hover:text-fd-primary/80"
          >
            Повторить
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-fd-muted-foreground">Пока нет постов.</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-fd-border">
            {posts.map((post) => (
              <PostCard
                key={`${post.authorLogin}-${post.slug}`}
                post={post}
                author={findAuthor(authors, post.authorLogin)}
              />
            ))}
          </div>

          {loadingMore && (
            <div className="divide-y divide-fd-border">
              {[0, 1, 2].map((i) => (
                <SkeletonCard key={`loading-more-${i}`} />
              ))}
            </div>
          )}

          {!loadingMore && nextPage && (
            <div className="flex justify-center py-8">
              <button
                onClick={loadMore}
                className="text-sm font-medium text-fd-primary transition-colors hover:text-fd-primary/80"
              >
                Показать ещё
              </button>
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
  const [segments, setSegments] = useState<string[]>(getPathSegments());

  useEffect(() => {
    setSegments(getPathSegments());
  }, []);

  const author = segments[0] ?? '';

  const [authorEntry, setAuthorEntry] = useState<AuthorEntry | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
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
              posts.map((post) => (
                <PostCard
                  key={`${post.authorLogin}-${post.slug}`}
                  post={post}
                  author={authorEntry}
                />
              ))
            )}
          </div>
        </>
      )}
    </DocsPage>
  );
}

// ── Blog post page ──────────────────────────────────────────────────────────

export function BlogPostClient() {
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
            </div>
          </div>

          <DocsBody>
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
              Обсудить на GitHub →
            </a>
          </footer>
        </>
      )}
    </DocsPage>
  );
}
