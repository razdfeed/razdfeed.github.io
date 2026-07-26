const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

const TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_GRAPHQL_TOKEN || '';

export interface GiscusConfig {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
}

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T | null> {
  if (!TOKEN) return null;

  try {
    const res = await fetch(GITHUB_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 86400 },
    });

    if (!res.ok) return null;
    const json = await res.json();
    if (json.errors) return null;
    return json.data as T;
  } catch {
    return null;
  }
}

export async function fetchGiscusConfig(repo: string): Promise<GiscusConfig | null> {
  const [owner, name] = repo.split('/');
  if (!owner || !name) return null;

  const data = await graphql<{
    repository: {
      id: string;
      discussionCategories: {
        nodes: Array<{ id: string; name: string }>;
      };
    } | null;
  }>(
    `
    query($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        id
        discussionCategories(first: 25) {
          nodes { id name }
        }
      }
    }
    `,
    { owner, name },
  );

  if (!data?.repository) return null;

  const category =
    data.repository.discussionCategories.nodes.find(
      (c) => c.name === 'Announcements' || c.name === 'General',
    ) ?? data.repository.discussionCategories.nodes[0];

  if (!category) return null;

  return {
    repo,
    repoId: data.repository.id,
    category: category.name,
    categoryId: category.id,
  };
}
