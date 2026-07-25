import { getAuthorInfo, getBlogPosts } from '@/lib/github';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import Link from 'next/link';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ author: string }>;
}): Promise<Metadata> {
  const { author } = await params;
  const user = await getAuthorInfo(author);

  return {
    title: user?.name ?? author,
    description: user?.bio ?? `Блог ${author} на razdfeed`,
  };
}

export async function generateStaticParams() {
  return [{ author: 'dealenx' }];
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ author: string }>;
}) {
  const { author } = await params;
  const [user, posts] = await Promise.all([
    getAuthorInfo(author),
    getBlogPosts(author),
  ]);

  return (
    <HomeLayout {...baseOptions()}>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <header className="mb-12 flex items-center gap-4">
          {user?.avatarUrl && (
            <img
              src={user.avatarUrl}
              alt={author}
              width={64}
              height={64}
              className="rounded-full"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">{user?.name ?? author}</h1>
            {user?.bio && (
              <p className="text-fd-muted-foreground">{user.bio}</p>
            )}
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
                  <Link
                    href={`/${author}/${post.slug}`}
                    className="group block"
                  >
                    <h3 className="text-lg font-medium group-hover:underline">
                      {post.title}
                    </h3>
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
                          <span
                            key={label}
                            className="rounded-full bg-fd-muted px-2 py-0.5 text-xs"
                          >
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