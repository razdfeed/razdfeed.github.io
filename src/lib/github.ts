const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

const TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_GRAPHQL_TOKEN || '';

export interface DiscussionPost {
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

export interface BlogConfig {
  name: string;
  description: string;
  language: string;
  category: string;
  labels: string[];
  author: {
    name: string;
    github: string;
  };
  source?: {
    repo: string;
    category?: string;
    labels?: string[];
  };
}

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`GitHub GraphQL error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(`GitHub GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data as T;
}

function slugify(title: string, number: number): string {
  return String(number);
}

export async function fetchDiscussions(
  owner: string,
  repo: string,
  category?: string,
): Promise<DiscussionPost[]> {
  const query = `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        discussions(first: 50, orderBy: {field: CREATED_AT, direction: DESC}) {
          nodes {
            number
            title
            body
            url
            createdAt
            updatedAt
            author { login url avatarUrl }
            labels(first: 10) { nodes { name } }
            category { name }
          }
        }
      }
    }
  `;

  const data = await graphql<{
    repository: {
      discussions: {
        nodes: Array<{
          number: number;
          title: string;
          body: string;
          url: string;
          createdAt: string;
          updatedAt: string;
          author: { login: string; url: string; avatarUrl: string } | null;
          labels: { nodes: Array<{ name: string }> };
          category: { name: string } | null;
        }>;
      };
    };
  }>(query, { owner, repo });

  let posts = data.repository.discussions.nodes.map((d) => ({
    number: d.number,
    title: d.title,
    body: d.body,
    url: d.url,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    author: d.author?.login ?? 'unknown',
    authorUrl: d.author?.url ?? '',
    authorAvatar: d.author?.avatarUrl ?? '',
    category: d.category?.name ?? '',
    labels: d.labels.nodes.map((l) => l.name),
    slug: slugify(d.title, d.number),
  }));

  if (category) {
    posts = posts.filter((p) => p.category === category);
  }

  return posts;
}

export async function fetchDiscussion(
  owner: string,
  repo: string,
  number: number,
): Promise<DiscussionPost | null> {
  const query = `
    query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        discussion(number: $number) {
          number
          title
          body
          url
          createdAt
          updatedAt
          author { login url avatarUrl }
          labels(first: 10) { nodes { name } }
          category { name }
        }
      }
    }
  `;

  try {
    const data = await graphql<{
      repository: {
        discussion: {
          number: number;
          title: string;
          body: string;
          url: string;
          createdAt: string;
          updatedAt: string;
          author: { login: string; url: string; avatarUrl: string } | null;
          labels: { nodes: Array<{ name: string }> };
          category: { name: string } | null;
        } | null;
      };
    }>(query, { owner, repo, number });

    const d = data.repository.discussion;
    if (!d) return null;

    return {
      number: d.number,
      title: d.title,
      body: d.body,
      url: d.url,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      author: d.author?.login ?? 'unknown',
      authorUrl: d.author?.url ?? '',
      authorAvatar: d.author?.avatarUrl ?? '',
      category: d.category?.name ?? '',
      labels: d.labels.nodes.map((l) => l.name),
      slug: slugify(d.title, d.number),
    };
  } catch {
    return null;
  }
}

export async function fetchBlogConfig(
  owner: string,
  repo: string,
): Promise<BlogConfig | null> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/.razdfeed.yml`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const text = await res.text();

    const config: BlogConfig = {
      name: owner,
      description: '',
      language: 'ru',
      category: 'Announcements',
      labels: [],
      author: {
        name: owner,
        github: owner,
      },
    };

    const nameMatch = text.match(/name:\s*["']?([^"'\n]+)["']?/);
    if (nameMatch) config.name = nameMatch[1].trim();

    const descMatch = text.match(/description:\s*["']?([^"'\n]+)["']?/);
    if (descMatch) config.description = descMatch[1].trim();

    const catMatch = text.match(/category:\s*["']?([^"'\n]+)["']?/);
    if (catMatch) config.category = catMatch[1].trim();

    const langMatch = text.match(/language:\s*["']?([^"'\n]+)["']?/);
    if (langMatch) config.language = langMatch[1].trim();

    const sourceRepoMatch = text.match(/repo:\s*["']?([^"'\n]+)["']?/);
    if (sourceRepoMatch) {
      config.source = {
        repo: sourceRepoMatch[1].trim(),
      };
    }

    return config;
  } catch {
    return null;
  }
}

export async function getBlogPosts(author: string): Promise<DiscussionPost[]> {
  const config = await fetchBlogConfig(author, 'razdfeed');

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

  let posts = await fetchDiscussions(postsOwner, postsRepo, category);

  if (posts.length === 0 && postsRepo === 'razdfeed') {
    posts = await fetchDiscussions(author, author, category);
  }

  if (config?.labels && config.labels.length > 0) {
    return posts.filter((p) =>
      p.labels.some((l) => config.labels!.includes(l)),
    );
  }

  return posts;
}

export async function getBlogPost(
  author: string,
  slug: string,
): Promise<DiscussionPost | null> {
  const posts = await getBlogPosts(author);
  return posts.find((p) => p.slug === slug) ?? null;
}

export async function getAuthorInfo(author: string) {
  const query = `
    query($login: String!) {
      user(login: $login) {
        login
        name
        avatarUrl
        bio
        url
      }
    }
  `;

  try {
    const data = await graphql<{
      user: {
        login: string;
        name: string | null;
        avatarUrl: string;
        bio: string | null;
        url: string;
      } | null;
    }>(query, { login: author });

    return data.user;
  } catch {
    return null;
  }
}