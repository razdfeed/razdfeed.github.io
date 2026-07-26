'use client';

import type { ComponentProps } from 'react';
import { TOCScrollArea } from 'fumadocs-ui/components/toc';
import Link from 'next/link';

interface AuthorEntry {
  login: string;
  name: string;
  avatar: string;
  htmlUrl: string;
  postCount: number;
}

function RightSidebarAuthors({ authors }: { authors: AuthorEntry[] }) {
  if (authors.length === 0) {
    return (
      <div id="nd-toc" className="sticky top-(--fd-docs-row-1) h-[calc(var(--fd-docs-height)-var(--fd-docs-row-1))] flex flex-col [grid-area:toc] w-(--fd-toc-width) pt-12 pe-4 pb-2 xl:layout:[--fd-toc-width:268px] max-xl:hidden">
        <div id="nd-toc-placeholder" className="hidden" />
      </div>
    );
  }

  return (
    <div
      id="nd-toc"
      className="sticky top-(--fd-docs-row-1) h-[calc(var(--fd-docs-height)-var(--fd-docs-row-1))] flex flex-col [grid-area:toc] w-(--fd-toc-width) pt-12 pe-4 pb-2 xl:layout:[--fd-toc-width:268px] max-xl:hidden"
    >
      <h3 className="mb-4 text-sm font-medium text-fd-muted-foreground">
        Авторы на сайте
      </h3>
      <TOCScrollArea className="ms-px">
        <ul className="flex flex-col gap-4">
          {authors.map((author) => (
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
                    className="rounded-full shrink-0"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-fd-muted shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium leading-snug transition-colors group-hover:text-fd-primary line-clamp-2">
                    {author.name}
                  </p>
                  <p className="mt-1 text-xs text-fd-muted-foreground">
                    {author.postCount} постов
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </TOCScrollArea>
    </div>
  );
}

interface HomeTOCProps extends ComponentProps<'div'> {
  authors?: AuthorEntry[];
}

export function HomeTOC({ authors = [], ...props }: HomeTOCProps) {
  return <RightSidebarAuthors authors={authors} {...props} />;
}