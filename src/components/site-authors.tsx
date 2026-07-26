'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { type AuthorEntry } from '@/lib/data';

interface SiteAuthorsProps {
  authors: AuthorEntry[];
  limit?: number;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function SiteAuthors({ authors, limit = 5 }: SiteAuthorsProps) {
  const chosen = useMemo(() => shuffle(authors).slice(0, limit), [authors, limit]);

  if (chosen.length === 0) return null;

  return (
    <aside className="w-full rounded-lg border bg-fd-card p-4 shadow-sm md:w-80">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-fd-muted-foreground">
        Авторы на сайте
      </h3>
      <ul className="flex flex-col gap-4">
        {chosen.map((author) => (
          <li key={author.login}>
            <Link
              href={`/${author.login}`}
              className="group flex items-start gap-3"
            >
              {author.avatar ? (
                <img
                  src={author.avatar}
                  alt={author.login}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-fd-muted" />
              )}
              <div className="flex-1">
                <h4 className="text-sm font-medium leading-snug transition-colors group-hover:text-fd-primary line-clamp-2">
                  {author.name}
                </h4>
                <p className="mt-1 text-xs text-fd-muted-foreground">
                  {author.postCount} постов
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
