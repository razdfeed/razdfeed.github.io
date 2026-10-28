'use client';

import { Check, Copy } from 'lucide-react';
import {
  buttonVariants,
} from 'fumadocs-ui/components/ui/button';
import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button';
import { ViewOptionsPopover } from 'fumadocs-ui/layouts/docs/page';
import type { FeedPost } from '@/lib/data';

// Canonical URL: independent of basePath and trailing-slash routing.
const pageUrl = (post: FeedPost) =>
  `https://razdfeed.github.io/${post.authorLogin}/${post.slug}/`;

function CopyPromptButton({ post }: { post: FeedPost }) {
  const url = pageUrl(post);
  const [checked, onClick] = useCopyButton(() => {
    console.info('[post-actions] copy prompt %s', url);
    return navigator.clipboard.writeText(
      `Read ${url}, I want to ask questions about it.`,
    );
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className={buttonVariants({
        variant: 'secondary',
        size: 'sm',
        className: 'gap-2 [&_svg]:size-3.5 [&_svg]:text-fd-muted-foreground',
      })}
    >
      {checked ? <Check /> : <Copy />}
      Copy Prompt
    </button>
  );
}

function CopyMarkdownButton({ post }: { post: FeedPost }) {
  const [checked, onClick] = useCopyButton(() => {
    // Post bodies come from the data API at build time and are already in the
    // client bundle — no per-post markdown endpoint needed.
    const markdown = [
      `# ${post.title}`,
      '',
      `> ${post.authorName ?? post.author} · ${post.createdAt}`,
      '',
      post.body,
      '',
      `Источник: ${post.url}`,
      '',
    ].join('\n');
    console.info(
      '[post-actions] copy markdown %s (%d chars)',
      post.slug,
      markdown.length,
    );
    return navigator.clipboard.writeText(markdown);
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className={buttonVariants({
        variant: 'secondary',
        size: 'sm',
        className: 'gap-2 [&_svg]:size-3.5 [&_svg]:text-fd-muted-foreground',
      })}
    >
      {checked ? <Check /> : <Copy />}
      Copy Markdown
    </button>
  );
}

export function PostActions({ post }: { post: FeedPost }) {
  // Telegram post URLs point at t.me, not a GitHub source — hide that item.
  const githubUrl = post.sourceType === 'telegram' ? undefined : post.url;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <CopyPromptButton post={post} />
      <CopyMarkdownButton post={post} />
      <ViewOptionsPopover githubUrl={githubUrl} />
    </div>
  );
}
