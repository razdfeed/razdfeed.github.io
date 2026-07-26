'use client';

import type { ComponentProps } from 'react';

export function HomeContainer({ className, ...props }: ComponentProps<'article'>) {
  return (
    <article
      id="nd-page"
      data-full={true}
      {...props}
      className={
        'flex flex-col w-full max-w-[680px] mx-auto [grid-area:main] px-4 py-6 gap-4 md:px-6 md:pt-8 xl:px-8 xl:pt-14' +
        (className ? ` ${className}` : '')
      }
    >
      {props.children}
    </article>
  );
}