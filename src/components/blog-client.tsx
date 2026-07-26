'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { MarkdownRenderer } from '@/components/markdown-renderer';

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

const DATA_BASE =
  process.env.NEXT_PUBLIC_DATA_BASE ??
  'https://razdfeed.github.io/fetcher-collector/public/data';

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
  description: string;
  language: string;
  avatar: string;
  bio: string | null;
  htmlUrl: string;
  blog: string | null;
  repo: string;
  sourceRepo: string;
  postCount: number;
  latestPostAt: string | null;
}

interface AuthorsFile {
  generatedAt: string;
  count: number;
  authors: AuthorEntry[];
}

interface PostsPage {
  page: number;
  pageSize: number;
  totalPosts: number;
  totalPages: number;
  nextPage: string | null;
  prevPage: string | null;
  posts: FeedPost[];
}

// ── Data fetching ──────────────────────────────────────────────────────────

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${DATA_BASE}/${path}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchAllPosts(): Promise<FeedPost[]> {
  let page = await fetchJson<PostsPage>('posts-1.json');
  if (!page) return [];
  const all: FeedPost[] = [...page.posts];
  // Follow pagination — safety cap to avoid infinite loops
  for (let i = 0; i < 50 && page.nextPage; i++) {
    page = await fetchJson<PostsPage>(page.nextPage);
    if (!page) break;
    all.push(...page.posts);
  }
  return all;
}

async function fetchAuthors(): Promise<AuthorEntry[]> {
  const data = await fetchJson<AuthorsFile>('authors.json');
  return data?.authors ?? [];
}

function findAuthor(authors: AuthorEntry[], login: string): AuthorEntry | null {
  return authors.find((a) => a.login === login) ?? null;
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

function cleanGitHubHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;

  tmp.querySelectorAll('a').forEach((el) => {
    const href = el.getAttribute('href') ?? '';
    if (href.startsWith('https://private-user-images.githubusercontent.com/')) {
      const img = el.querySelector('img');
      if (img) {
        const src = img.getAttribute('src') ?? '';
        const alt = img.getAttribute('alt') ?? '';
        el.outerHTML = `<img src="${src}" alt="${alt}" />`;
      }
    }
  });

  tmp.querySelectorAll('img').forEach((el) => {
    el.removeAttribute('width');
    el.removeAttribute('height');
    el.removeAttribute('style');
    el.removeAttribute('class');
  });

  tmp.querySelectorAll('div.highlight').forEach((el) => {
    const pre = el.querySelector('pre');
    if (pre) {
      const code = pre.textContent ?? '';
      const lang = el.className.match(/highlight-source-(\w+)/)?.[1] ?? 'text';
      el.outerHTML = `\n\`\`\`${lang}\n${code.replace(/\n$/, '')}\n\`\`\`\n`;
    }
  });

  tmp.querySelectorAll('.snippet-clipboard-content').forEach((el) => {
    const code = el.querySelector('code');
    if (code) {
      const text = code.textContent ?? '';
      el.outerHTML = `\n\`\`\`\n${text.replace(/\n$/, '')}\n\`\`\`\n`;
    }
  });

  tmp.querySelectorAll('[dir]').forEach((el) => el.removeAttribute('dir'));
  tmp.querySelectorAll('.js-gh-image-fallback').forEach((el) => el.remove());

  return tmp.innerHTML;
}

// ── Home page: all authors + latest posts feed ─────────────────────────────

export function HomePageClient() {
  const [authors, setAuthors] = useState<AuthorEntry[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [a, p] = await Promise.all([fetchAuthors(), fetchAllPosts()]);
      setAuthors(a);
      setPosts(p);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <HomeLayout {...baseOptions()}>
        <div className="mx-auto max-w-2xl px-4 py-12">
          <p className="text-fd-muted-foreground">Загрузка…</p>
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout {...baseOptions()}>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">razdfeed</h1>
        <p className="text-fd-muted-foreground mb-8">
          Агрегатор блогов на GitHub Discussions
        </p>

        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4">
            Авторы <span className="text-fd-muted-foreground text-sm">({authors.length})</span>
          </h2>
          {authors.length === 0 ? (
            <p className="text-fd-muted-foreground">Пока нет авторов.</p>
          ) : (
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
                    <Link href={`/${a.login}`} className="font-medium hover:underline">
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
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Свежие посты</h2>
          {posts.length === 0 ? (
            <p className="text-fd-muted-foreground">Пока нет постов.</p>
          ) : (
            <ul className="space-y-5">
              {posts.slice(0, 20).map((post) => (
                <li key={`${post.authorLogin}-${post.slug}`}>
                  <Link
                    href={`/${post.authorLogin}/${post.slug}`}
                    className="group block"
                  >
                    <h3 className="text-lg font-medium group-hover:underline">
                      {post.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-fd-muted-foreground">
                      {post.authorAvatar && (
                        <img
                          src={post.authorAvatar}
                          alt=""
                          width={18}
                          height={18}
                          className="rounded-full"
                        />
                      )}
                      <span>{post.authorName ?? post.authorLogin}</span>
                      <span>·</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </HomeLayout>
  );
}

// ── Author page ─────────────────────────────────────────────────────────────

export function AuthorPageClient() {
  const [segments, setSegments] = useState<string[]>(getPathSegments());

  useEffect(() => {
    setSegments(getPathSegments());
  }, []);

  const author = segments[0] ?? '';

  const [authorEntry, setAuthorEntry] = useState<AuthorEntry | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
      setLoading(false);
    }
    load();
  }, [author]);

  if (loading) {
    return (
      <HomeLayout {...baseOptions()}>
        <div className="mx-auto max-w-2xl px-4 py-12">
          <p className="text-fd-muted-foreground">Загрузка…</p>
        </div>
      </HomeLayout>
    );
  }

  if (notFound) {
    return (
      <HomeLayout {...baseOptions()}>
        <div className="mx-auto max-w-2xl px-4 py-12">
          <p className="text-fd-muted-foreground">Автор не найден или блог не настроен.</p>
          <Link href="/" className="text-sm text-fd-muted-foreground hover:underline">
            ← На главную
          </Link>
        </div>
      </HomeLayout>
    );
  }

  const avatar = authorEntry?.avatar ?? posts[0]?.authorAvatar ?? '';
  const displayName = authorEntry?.name ?? posts[0]?.authorName ?? author;
  const bio = authorEntry?.bio ?? null;
  const htmlUrl = authorEntry?.htmlUrl ?? `https://github.com/${author}`;

  return (
    <HomeLayout {...baseOptions()}>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <header className="mb-12 flex items-center gap-4">
          {avatar && (
            <img src={avatar} alt={author} width={64} height={64} className="rounded-full" />
          )}
          <div>
            <h1 className="text-2xl font-bold">{displayName}</h1>
            {bio && <p className="text-fd-muted-foreground">{bio}</p>}
            <a
              href={htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-fd-muted-foreground hover:underline"
            >
              @{author}
            </a>
          </div>
        </header>

        <section>
          <h2 className="mb-6 text-lg font-semibold">
            Посты <span className="text-fd-muted-foreground text-sm">({posts.length})</span>
          </h2>
          {posts.length === 0 ? (
            <p className="text-fd-muted-foreground">Пока нет постов.</p>
          ) : (
            <ul className="space-y-6">
              {posts.map((post) => (
                <li key={post.number}>
                  <Link href={`/${author}/${post.slug}`} className="group block">
                    <h3 className="text-lg font-medium group-hover:underline">{post.title}</h3>
                    <p className="mt-1 text-sm text-fd-muted-foreground">
                      {formatDate(post.createdAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </HomeLayout>
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
  const [loading, setLoading] = useState(true);
  const [notFoundPost, setNotFoundPost] = useState(false);

  useEffect(() => {
    if (!author || !slug) return;
    async function load() {
      const [allAuthors, allPosts] = await Promise.all([
        fetchAuthors(),
        fetchAllPosts(),
      ]);
      setAuthorEntry(findAuthor(allAuthors, author));
      const found = allPosts.find(
        (p) => p.authorLogin === author && p.slug === slug,
      );
      if (!found) {
        setNotFoundPost(true);
      } else {
        setPost(found);
      }
      setLoading(false);
    }
    load();
  }, [author, slug]);

  if (loading) {
    return (
      <HomeLayout {...baseOptions()}>
        <div className="mx-auto max-w-3xl px-4 py-12">
          <p className="text-fd-muted-foreground">Загрузка…</p>
        </div>
      </HomeLayout>
    );
  }

  if (notFoundPost || !post) {
    return (
      <HomeLayout {...baseOptions()}>
        <div className="mx-auto max-w-3xl px-4 py-12">
          <p className="text-fd-muted-foreground">Пост не найден.</p>
          <Link href={`/${author}`} className="text-sm text-fd-muted-foreground hover:underline">
            ← {authorEntry?.name ?? author}
          </Link>
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout {...baseOptions()}>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <nav className="mb-8">
          <Link href={`/${author}`} className="text-sm text-fd-muted-foreground hover:underline">
            ← {authorEntry?.name ?? post.authorName ?? author}
          </Link>
        </nav>

        <header className="mb-8 border-b pb-6">
          <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
          <div className="mt-4 flex items-center gap-3">
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
              <a
                href={authorEntry?.htmlUrl ?? `https://github.com/${author}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                {post.authorName ?? author}
              </a>
              {' · '}
              {formatDate(post.createdAt)}
            </div>
          </div>
        </header>

        <article className="prose prose-fd max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-pre:rounded-lg prose-pre:bg-fd-muted/50 prose-img:rounded-lg">
          <MarkdownRenderer content={post.body} />
        </article>

        <footer className="mt-12 border-t pt-6">
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-fd-muted-foreground hover:underline"
          >
            Обсудить на GitHub →
          </a>
        </footer>
      </div>
    </HomeLayout>
  );
}