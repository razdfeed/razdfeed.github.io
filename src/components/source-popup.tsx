'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SourcePopupProps {
  repo: string;
}

export function SourcePopup({ repo }: SourcePopupProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const [owner] = repo.split('/');

  return (
    <>
      <button
        type="button"
        title="Опубликовано через GitHub"
        onClick={() => setOpen(true)}
        className="ms-0.5 inline-flex cursor-pointer items-center"
      >
        <svg
          viewBox="0 0 24 24"
          width={12}
          height={12}
          fill="currentColor"
          className="text-fd-muted-foreground transition-colors hover:text-fd-foreground"
          aria-hidden="true"
        >
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl bg-fd-background p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full p-1 text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
              aria-label="Закрыть"
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-4 flex items-center justify-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-fd-muted">
                <svg viewBox="0 0 24 24" width={32} height={32} fill="currentColor" className="text-fd-foreground">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </div>
              <span className="text-2xl">→</span>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-fd-primary/10">
                <img src="/logo.png" alt="RazdFeed" width={40} height={40} className="rounded" />
              </div>
            </div>

            <h3 className="mb-2 text-xl font-semibold">Пост из GitHub</h3>
            <p className="mb-6 text-sm text-fd-muted-foreground">
              Наш бот автоматически импортировал этот пост из репозитория автора. Вы можете подключить свой блог и публиковать посты через GitHub.
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/docs"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-fd-primary px-4 py-3 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
              >
                Как подключить
              </Link>
              <a
                href={`https://github.com/${repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border bg-fd-secondary px-4 py-3 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
              >
                Репозиторий @{owner}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
