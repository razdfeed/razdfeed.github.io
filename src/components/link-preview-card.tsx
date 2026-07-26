'use client';

import type { LinkPreview } from '@/lib/data';

export function LinkPreviewCard({ preview }: { preview: LinkPreview }) {
  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-4 flex flex-col overflow-hidden rounded-xl border border-fd-border bg-fd-secondary transition-colors hover:bg-fd-accent"
    >
      {preview.image && (
        <div
          className="w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${preview.image})`, aspectRatio: '16 / 9' }}
        />
      )}
      <div className="flex min-w-0 flex-col gap-1 px-4 py-3">
        {preview.siteName && (
          <span className="text-xs font-medium text-fd-primary">
            {preview.siteName}
          </span>
        )}
        {preview.title && (
          <span className="text-sm font-medium text-fd-foreground line-clamp-2">
            {preview.title}
          </span>
        )}
        {preview.description && (
          <span className="text-xs text-fd-muted-foreground line-clamp-2">
            {preview.description}
          </span>
        )}
      </div>
    </a>
  );
}