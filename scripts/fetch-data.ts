import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const AUTHORS = (process.env.AUTHORS ?? 'dealenx').split(',').map(a => a.trim());

interface Post {
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

function parseAtomFeed(xml: string, author: string): Post[] {
  const posts: Post[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    const id = entry.match(/<id>(.*?)<\/id>/)?.[1] ?? '';
    const link = entry.match(/<link[^>]*rel="alternate"[^>]*href="([^"]*)"/)?.[1] ?? '';
    const number = parseInt(link.match(/\/discussions\/(\d+)/)?.[1] ?? id.split(':').pop() ?? '0', 10);
    const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? '';
    const publishedMatch = entry.match(/<published>(.*?)<\/published>/)?.[1] ?? '';
    const content = entry.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] ?? '';
    const authorName = entry.match(/<author>\s*<name>(.*?)<\/name>/)?.[1] ?? author;
    const authorUri = entry.match(/<author>\s*<uri>(.*?)<\/uri>/)?.[1] ?? '';
    const thumbnail = entry.match(/<thumbnail[^>]*url="([^"]*)"/)?.[1] ?? '';

    posts.push({
      number,
      title,
      body: content,
      url: link,
      createdAt: publishedMatch,
      author: authorName,
      authorUrl: authorUri,
      authorAvatar: thumbnail,
      slug: String(number),
    });
  }

  return posts;
}

async function fetchPosts(author: string): Promise<Post[]> {
  const configUrl = `https://raw.githubusercontent.com/${author}/razdfeed/main/.razdfeed.yml`;
  let repo = 'razdfeed';
  let owner = author;

  try {
    const configRes = await fetch(configUrl);
    if (configRes.ok) {
      const text = await configRes.text();
      const repoMatch = text.match(/repo:\s*["']?([^"'\n]+)["']?/);
      if (repoMatch) {
        const parts = repoMatch[1].trim().split('/');
        if (parts.length === 2) {
          owner = parts[0];
          repo = parts[1];
        } else {
          repo = parts[0];
        }
      }
    }
  } catch {}

  const feedUrl = `https://github.com/${owner}/${repo}/discussions.atom`;

  try {
    const res = await fetch(feedUrl);
    if (!res.ok) {
      console.log(`  Feed fetch failed: ${res.status} ${res.statusText} for ${feedUrl}`);
      if (owner !== author) return [];
      const fallbackUrl = `https://github.com/${author}/${author}/discussions.atom`;
      console.log(`  Trying fallback: ${fallbackUrl}`);
      const fallbackRes = await fetch(fallbackUrl);
      if (!fallbackRes.ok) return [];
      const xml = await fallbackRes.text();
      if (!xml.includes('<entry>')) return [];
      return parseAtomFeed(xml, author);
    }
    const xml = await res.text();
    if (!xml.includes('<entry>')) {
      console.log(`  Feed has no entries, length: ${xml.length}`);
      if (owner !== author) return [];
      const fallbackUrl = `https://github.com/${author}/${author}/discussions.atom`;
      console.log(`  Trying fallback: ${fallbackUrl}`);
      const fallbackRes = await fetch(fallbackUrl);
      if (!fallbackRes.ok) return [];
      const fallbackXml = await fallbackRes.text();
      if (!fallbackXml.includes('<entry>')) return [];
      return parseAtomFeed(fallbackXml, author);
    }
    return parseAtomFeed(xml, author);
  } catch (e) {
    console.log(`  Feed fetch error: ${e}`);
    return [];
  }
}

async function fetchAuthorInfo(author: string) {
  try {
    const res = await fetch(`https://api.github.com/users/${author}`, {
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function main() {
  const outDir = join(process.cwd(), 'out', 'data');
  mkdirSync(outDir, { recursive: true });

  for (const author of AUTHORS) {
    console.log(`Fetching data for ${author}...`);
    const [posts, userInfo] = await Promise.all([
      fetchPosts(author),
      fetchAuthorInfo(author),
    ]);

    const authorDir = join(outDir, author);
    mkdirSync(authorDir, { recursive: true });

    writeFileSync(join(authorDir, 'posts.json'), JSON.stringify(posts, null, 2));
    writeFileSync(join(authorDir, 'author.json'), JSON.stringify(userInfo, null, 2));

    for (const post of posts) {
      writeFileSync(join(authorDir, `${post.slug}.json`), JSON.stringify(post, null, 2));
    }

    console.log(`  ${posts.length} posts, author: ${userInfo?.name ?? 'unknown'}`);
  }
}

main().catch(console.error);