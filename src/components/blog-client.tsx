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
  author: string;
  authorUrl: string;
  authorAvatar: string;
  slug: string;
}

interface AuthorInfo {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  html_url: string;
}

async function fetchPosts(author: string): Promise<DiscussionPost[]> {
  try {
    const res = await fetch(`/data/${author}/posts.json`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function fetchAuthorInfo(author: string): Promise<AuthorInfo | null> {
  try {
    const res = await fetch(`/data/${author}/author.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchPost(author: string, slug: string): Promise<DiscussionPost | null> {
  try {
    const res = await fetch(`/data/${author}/${slug}.json`);
    if (!res.ok) return null;
    return await res.json();
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
        const [postInfo, userInfo] = await Promise.all([
          fetchPost(author, slug),
          fetchAuthorInfo(author),
        ]);
        setUser(userInfo);
        if (!postInfo) {
          setNotFoundPost(true);
        } else {
          setPost(postInfo);
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

  const cleanBody = cleanGitHubHtml(post.body);

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
            {user?.avatar_url && (
              <img src={user.avatar_url} alt={author} width={32} height={32} className="rounded-full" />
            )}
            <div className="text-sm text-fd-muted-foreground">
              <a
                href={user?.html_url ?? `https://github.com/${author}`}
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
          {user?.avatar_url && (
            <img src={user.avatar_url} alt={author} width={64} height={64} className="rounded-full" />
          )}
          <div>
            <h1 className="text-2xl font-bold">{user?.name ?? author}</h1>
            {user?.bio && <p className="text-fd-muted-foreground">{user.bio}</p>}
            <a
              href={user?.html_url ?? `https://github.com/${author}`}
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