import { DynamicRoute } from '@/components/dynamic-route';
import { fetchAllPosts, fetchAuthors, findAuthor } from '@/lib/data';
import { fetchGiscusConfig } from '@/lib/giscus';
import type { GiscusConfig } from '@/components/giscus-comments';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  const [authors, posts] = await Promise.all([
    fetchAuthors(),
    fetchAllPosts(),
  ]);

  const paths: { path: string[] }[] = [];

  for (const author of authors) {
    paths.push({ path: [author.login] });
  }

  for (const post of posts) {
    paths.push({ path: [post.authorLogin, post.slug] });
  }

  if (paths.length === 0) {
    paths.push({ path: ['_author'] }, { path: ['_author', '_post'] });
  }

  return paths;
}

interface PathPageProps {
  params: Promise<{ path?: string[] }>;
}

export async function generateMetadata({ params }: PathPageProps): Promise<Metadata> {
  const { path } = await params;
  const segments = path ?? [];

  if (segments.length === 0) {
    return {};
  }

  const [authors, posts] = await Promise.all([
    fetchAuthors(),
    fetchAllPosts(),
  ]);

  if (segments.length === 1) {
    const author = findAuthor(authors, segments[0]);
    if (!author) return {};

    const displayName = author.name || author.login;
    const description = author.bio
      ? `${author.bio} — ${author.postCount} пост(ов) на RazdFeed`
      : `Посты ${displayName} из GitHub Issues на RazdFeed — ${author.postCount} публикаций`;

    return {
      title: displayName,
      description,
      openGraph: {
        title: `${displayName} | RazdFeed`,
        description,
        images: author.avatar ? [author.avatar] : undefined,
        type: 'profile',
      },
      twitter: {
        card: 'summary',
        title: `${displayName} | RazdFeed`,
        description,
        images: author.avatar ? [author.avatar] : undefined,
      },
      alternates: {
        canonical: `https://razdfeed.github.io/${author.login}/`,
      },
    };
  }

  if (segments.length >= 2) {
    const [authorLogin, slug] = segments;
    const post = posts.find(
      (p) => p.authorLogin === authorLogin && p.slug === slug,
    );
    if (!post) return {};

    const author = findAuthor(authors, authorLogin);
    const authorName = author?.name || author?.login || post.author;

    const fallbackTitle =
      post.linkPreview?.title ??
      (post.body ? post.body.slice(0, 80).replace(/\s+/g, ' ').trim() : undefined) ??
      `Пост от ${authorName}`;
    const title = post.title || fallbackTitle;

    const bodyClean = post.body ? post.body.replace(/!\[.*?\]\(.*?\)/g, '').replace(/\[.*?\]\(.*?\)/g, '').replace(/[#>*_~`\\-]/g, '').replace(/\s+/g, ' ').trim() : '';
    const description = bodyClean
      ? bodyClean.slice(0, 160)
      : post.linkPreview?.description ?? `Пост от ${authorName} на RazdFeed`;

    const ogImage = post.media?.images?.[0] ?? post.linkPreview?.image ?? undefined;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
        publishedTime: post.createdAt,
        modifiedTime: post.updatedAt,
        authors: [authorName],
        images: ogImage ? [ogImage] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ogImage ? [ogImage] : undefined,
      },
      alternates: {
        canonical: `https://razdfeed.github.io/${authorLogin}/${slug}/`,
      },
    };
  }

  return {};
}

export default async function Page({ params }: PathPageProps) {
  const { path } = await params;
  const segments = path ?? [];

  let giscusConfig: GiscusConfig | null = null;
  if (segments.length >= 2) {
    const [authorLogin, slug] = segments;
    const posts = await fetchAllPosts();
    const post = posts.find(
      (p) => p.authorLogin === authorLogin && p.slug === slug,
    );
    if (post?.sourceRepo) {
      giscusConfig = await fetchGiscusConfig(post.sourceRepo);
    }
  }

  return <DynamicRoute segments={segments} giscusConfig={giscusConfig} />;
}
