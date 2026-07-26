'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

export interface GiscusConfig {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
}

interface GiscusCommentsProps {
  config: GiscusConfig | null;
  term: string;
}

function resolveGiscusTheme(theme?: string, resolvedTheme?: string): string {
  if (theme === 'system' || (!theme && !resolvedTheme)) {
    return 'preferred_color_scheme';
  }
  return resolvedTheme === 'dark' || theme === 'dark' ? 'dark' : 'light';
}

export function GiscusComments({ config, term }: GiscusCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme, resolvedTheme } = useTheme();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !config) return;

    const giscusTheme = resolveGiscusTheme(theme, resolvedTheme);

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', config.repo);
    script.setAttribute('data-repo-id', config.repoId);
    script.setAttribute('data-category', config.category);
    script.setAttribute('data-category-id', config.categoryId);
    script.setAttribute('data-mapping', 'number');
    script.setAttribute('data-term', term);
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', giscusTheme);
    script.setAttribute('data-lang', 'ru');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(script);

    const timer = setTimeout(() => {
      const iframe = containerRef.current?.querySelector('iframe.giscus-frame');
      if (iframe) {
        setLoaded(true);
      } else {
        setFailed(true);
      }
    }, 5000);

    return () => {
      clearTimeout(timer);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [config, term, theme, resolvedTheme]);

  if (!config) {
    return (
      <section className="mt-12 border-t pt-6">
        <h3 className="mb-4 text-lg font-semibold">Комментарии</h3>
        <div className="rounded-lg border bg-fd-secondary/50 p-4 text-sm text-fd-muted-foreground">
          <p>Автор не настроил обсуждения для этого поста.</p>
          <p className="mt-1">
            Комментарии работают через{' '}
            <a
              href="https://giscus.app/ru"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fd-primary transition-colors hover:text-fd-primary/80"
            >
              giscus
            </a>
            {' '}и GitHub Discussions.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-12 border-t pt-6">
      <h3 className="mb-4 text-lg font-semibold">Комментарии</h3>
      {failed && !loaded && (
        <div className="rounded-lg border bg-fd-secondary/50 p-4 text-sm text-fd-muted-foreground">
          <p>Автор не настроил обсуждения для этого поста.</p>
          <p className="mt-1">
            Комментарии работают через{' '}
            <a
              href="https://giscus.app/ru"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fd-primary transition-colors hover:text-fd-primary/80"
            >
              giscus
            </a>
            {' '}и GitHub Discussions.
          </p>
        </div>
      )}
      <div ref={containerRef} className="min-h-[120px]" />
    </section>
  );
}
