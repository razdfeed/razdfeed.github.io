import type { MetadataRoute } from 'next';
import { fetchAllPosts, fetchAuthors } from '@/lib/data';
import { source } from '@/lib/source';

export const dynamic = 'force-static';

const BASE_URL = 'https://razdfeed.github.io';

function trailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [authors, posts] = await Promise.all([
    fetchAuthors(),
    fetchAllPosts(),
  ]);

  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: 'always',
      priority: 1,
    },
    {
      url: `${BASE_URL}/authors/`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.8,
    },
  ];

  const docsParams = source.generateParams();
  for (const param of docsParams) {
    const page = source.getPage(param.slug);
    if (page) {
      entries.push({
        url: `${BASE_URL}${trailingSlash(page.url)}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  }

  for (const author of authors) {
    entries.push({
      url: `${BASE_URL}/${author.login}/`,
      lastModified: author.latestPostAt ? new Date(author.latestPostAt) : now,
      changeFrequency: 'hourly',
      priority: 0.7,
    });
  }

  for (const post of posts) {
    entries.push({
      url: `${BASE_URL}/${post.authorLogin}/${post.slug}/`,
      lastModified: new Date(post.updatedAt || post.createdAt),
      changeFrequency: 'weekly',
      priority: 0.5,
    });
  }

  return entries;
}