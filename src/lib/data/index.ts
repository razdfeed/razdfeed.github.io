const DATA_BASE =
  process.env.NEXT_PUBLIC_DATA_BASE ??
  'https://razdfeed.github.io/fetcher-collector/public/data';

export interface FeedPostMedia {
  images: string[];
  videos: string[];
}

export interface LinkPreview {
  url: string;
  image: string | null;
  siteName: string | null;
  title: string | null;
  description: string | null;
}

export interface FeedPost {
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
  sourceType: 'github' | 'telegram' | string;
  category: string;
  labels: string[];
  slug: string;
  media?: FeedPostMedia;
  linkPreview?: LinkPreview;
}

export interface AuthorEntry {
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

export async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${DATA_BASE}/${path}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchAllPosts(): Promise<FeedPost[]> {
  let page = await fetchJson<PostsPage>('posts-1.json');
  if (!page) return [];
  const all: FeedPost[] = [...page.posts];
  for (let i = 0; i < 50 && page.nextPage; i++) {
    page = await fetchJson<PostsPage>(page.nextPage);
    if (!page) break;
    all.push(...page.posts);
  }
  return all;
}

export async function fetchAuthors(): Promise<AuthorEntry[]> {
  const data = await fetchJson<AuthorsFile>('authors.json');
  return data?.authors ?? [];
}

export function findAuthor(authors: AuthorEntry[], login: string): AuthorEntry | null {
  return authors.find((a) => a.login === login) ?? null;
}
