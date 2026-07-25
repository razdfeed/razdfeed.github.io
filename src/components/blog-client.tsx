'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { MarkdownRenderer } from '@/components/markdown-renderer';

interface DiscussionPost {
  number: number;
  title: string;
  body: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  authorUrl: string;
  authorAvatar: string;
  category: string;
  labels: string[];
  slug: string;
}

interface AuthorInfo {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  url: string;
}

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

async function fetchGraphQL(query: string, variables: Record<string, unknown>) {
  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  const res = await fetch(GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  return json.data;
}

async function fetchBlogConfig(author: string) {
  const url = `https://raw.githubusercontent.com/${author}/razdfeed/main/.razdfeed.yml`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();

    const config: { name: string; description: string; language: string; category: string; labels: string[]; source?: { repo: string; category?: string } } = {
      name: author,
      description: '',
      language: 'ru',
      category: 'Announcements',
      labels: [],
      source: undefined,
    };

    const nameMatch = text.match(/name:\s*["']?([^"'\n]+)["']?/);
    if (nameMatch) config.name = nameMatch[1].trim();
    const catMatch = text.match(/category:\s*["']?([^"'\n]+)["']?/);
    if (catMatch) config.category = catMatch[1].trim();
    const sourceRepoMatch = text.match(/repo:\s*["']?([^"'\n]+)["']?/);
    if (sourceRepoMatch) config.source = { repo: sourceRepoMatch[1].trim() };

    return config;
  } catch {
    return null;
  }
}

async function fetchPosts(author: string): Promise<DiscussionPost[]> {
  const config = await fetchBlogConfig(author);
  let postsOwner = author;
  let postsRepo = 'razdfeed';
  let category: string | undefined;

  if (config?.source?.repo) {
    const [owner, repo] = config.source.repo.split('/');
    postsOwner = owner;
    postsRepo = repo;
    category = config.source.category;
  } else if (config) {
    category = config.category;
  }

  const query = `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        discussions(first: 50, orderBy: {field: CREATED_AT, direction: DESC}) {
          nodes {
            number title body url createdAt updatedAt
            author { login url avatarUrl }
            labels(first: 10) { nodes { name } }
            category { name }
          }
        }
      }
    }
  `;

  try {
    const data = await fetchGraphQL(query, { owner: postsOwner, repo: postsRepo });
    let posts: DiscussionPost[] = data.repository.discussions.nodes.map((d: Record<string, unknown>) => ({
      number: d.number as number,
      title: d.title as string,
      body: d.body as string,
      url: d.url as string,
      createdAt: d.createdAt as string,
      updatedAt: d.updatedAt as string,
      author: (d.author as { login: string })?.login ?? 'unknown',
      authorUrl: (d.author as { url: string })?.url ?? '',
      authorAvatar: (d.author as { avatarUrl: string })?.avatarUrl ?? '',
      category: (d.category as { name: string })?.name ?? '',
      labels: ((d.labels as { nodes: Array<{ name: string }> })?.nodes ?? []).map((l) => l.name),
      slug: String(d.number),
    }));

    if (category) posts = posts.filter((p) => p.category === category);
    return posts;
  } catch {
    return [];
  }
}

async function fetchAuthorInfo(author: string): Promise<AuthorInfo | null> {
  const query = `
    query($login: String!) {
      user(login: $login) {
        login name avatarUrl bio url
      }
    }
  `;
  try {
    const data = await fetchGraphQL(query, { login: author });
    return data.user;
  } catch {
    return null;
  }
}

function getPathSegments(): string[] {
  if (typeof window === 'undefined') return [];
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  const path = window.location.pathname.replace(base, '');
  return path.split('/').filter(Boolean);
}

export function BlogPostClient() {
  const [segments, setSegments] = useState<string[]>(getPathSegments());

  useEffect(() => {
    setSegments(getPathSegments());
  }, []);

  const author = segments[0] ?? '';
  const slug = segments[1] ?? '';

  const [post, setPost] = useState<DiscussionPost | null>(null);
  const [user, setUser] = useState<AuthorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundPost, setNotFoundPost] = useState(false);

  useEffect(() => {
    if (!author || !slug) return;
    async function load() {
      try {
        const [posts, userInfo] = await Promise.all([
          fetchPosts(author),
          fetchAuthorInfo(author),
        ]);
        setUser(userInfo);
        const found = posts.find((p) => p.slug === slug);
        if (!found) {
          setNotFoundPost(true);
        } else {
          setPost(found);
        }
      } catch {
        setNotFoundPost(true);
      } finally {
        setLoading(false);
      }
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
            ← {user?.name ?? author}
          </Link>
        </div>
      </HomeLayout>
    );
  }

  const cleanBody = post.body
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<img[^>]*width="\d+"[^>]*height="\d+"[^>]*>/gi, (match) =>
      match.replace(/width="\d+"\s+height="\d+"/gi, ''),
    )
    .replace(
      /<img\s+([^>]*?)src="([^"]*?)"([^>]*?)\s*\/?>/gi,
      (_full, before, src, after) => {
        const altMatch = `${before} ${after}`.match(/alt="([^"]*?)"/i);
        const alt = altMatch?.[1] ?? '';
        return `![${alt}](${src})`;
      },
    );

  return (
    <HomeLayout {...baseOptions()}>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <nav className="mb-8">
          <Link href={`/${author}`} className="text-sm text-fd-muted-foreground hover:underline">
            ← {user?.name ?? author}
          </Link>
        </nav>

        <header className="mb-8 border-b pb-6">
          <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
          <div className="mt-4 flex items-center gap-3">
            {user?.avatarUrl && (
              <img src={user.avatarUrl} alt={author} width={32} height={32} className="rounded-full" />
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
                <span key={label} className="rounded-full bg-fd-muted px-2 py-0.5 text-xs">
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

export function AuthorPageClient() {
  const [segments, setSegments] = useState<string[]>(getPathSegments());

  useEffect(() => {
    setSegments(getPathSegments());
  }, []);

  const author = segments[0] ?? '';

  const [user, setUser] = useState<AuthorInfo | null>(null);
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!author) return;
    async function load() {
      try {
        const [postsData, userInfo] = await Promise.all([
          fetchPosts(author),
          fetchAuthorInfo(author),
        ]);
        if (postsData.length === 0 && !userInfo) {
          setNotFound(true);
        } else {
          setPosts(postsData);
          setUser(userInfo);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
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

  return (
    <HomeLayout {...baseOptions()}>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <header className="mb-12 flex items-center gap-4">
          {user?.avatarUrl && (
            <img src={user.avatarUrl} alt={author} width={64} height={64} className="rounded-full" />
          )}
          <div>
            <h1 className="text-2xl font-bold">{user?.name ?? author}</h1>
            {user?.bio && <p className="text-fd-muted-foreground">{user.bio}</p>}
            <a
              href={user?.url ?? `https://github.com/${author}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-fd-muted-foreground hover:underline"
            >
              @{author}
            </a>
          </div>
        </header>

        <section>
          <h2 className="mb-6 text-lg font-semibold">Посты</h2>
          {posts.length === 0 ? (
            <p className="text-fd-muted-foreground">Пока нет постов.</p>
          ) : (
            <ul className="space-y-6">
              {posts.map((post) => (
                <li key={post.number}>
                  <Link href={`/${author}/${post.slug}`} className="group block">
                    <h3 className="text-lg font-medium group-hover:underline">{post.title}</h3>
                    <p className="mt-1 text-sm text-fd-muted-foreground">
                      {new Date(post.createdAt).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    {post.labels.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {post.labels.map((label) => (
                          <span key={label} className="rounded-full bg-fd-muted px-2 py-0.5 text-xs">
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
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