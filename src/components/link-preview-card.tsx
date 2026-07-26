'use client';

import type { LinkPreview } from '@/lib/data';

export function LinkPreviewCard({ preview }: { preview: LinkPreview }) {
  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-4 flex max-w-md overflow-hidden rounded-lg border border-fd-border bg-fd-secondary transition-colors hover:bg-fd-accent"
    >
      {preview.image && (
        <div
          className="h-20 w-20 shrink-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${preview.image})` }}
        />
      )}
      <div className="flex min-w-0 flex-col justify-center px-3 py-2">
        {preview.siteName && (
          <span className="mb-0.5 text-xs font-medium text-fd-primary">
            {preview.siteName}
          </span>
        )}
        {preview.title && (
          <span className="truncate text-sm font-medium text-fd-foreground">
            {preview.title}
          </span>
        )}
        {preview.description && (
          <span className="truncate text-xs text-fd-muted-foreground">
            {preview.description}
          </span>
        )}
      </div>
    </a>
  );
}