'use client';

import { useState } from 'react';
import type { LinkPreview } from '@/lib/data';
import { Link2 } from 'lucide-react';

export function LinkPreviewCard({ preview }: { preview: LinkPreview }) {
  const [imageFailed, setImageFailed] = useState(false);

  const showPlaceholder = !preview.image || imageFailed;

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-4 flex flex-col overflow-hidden rounded-xl border border-fd-border bg-fd-secondary transition-colors hover:bg-fd-accent"
    >
      {!showPlaceholder ? (
        <div
          className="w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${preview.image})`, aspectRatio: '16 / 9' }}
        >
          <img
            src={preview.image!}
            alt=""
            className="sr-only"
            onError={() => setImageFailed(true)}
          />
        </div>
      ) : (
        <div
          className="flex w-full items-center justify-center bg-fd-muted"
          style={{ aspectRatio: '16 / 9' }}
        >
          <Link2 className="h-10 w-10 text-fd-muted-foreground" />
        </div>
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