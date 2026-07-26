'use client';

import { useEffect, useRef, useState } from 'react';

interface GiscusCommentsProps {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  mapping?: 'pathname' | 'url' | 'title' | 'og:title' | 'number';
  term?: string;
}

export function GiscusComments({
  repo,
  repoId,
  category,
  categoryId,
  mapping = 'pathname',
  term,
}: GiscusCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', repo);
    script.setAttribute('data-repo-id', repoId);
    script.setAttribute('data-category', category);
    script.setAttribute('data-category-id', categoryId);
    script.setAttribute('data-mapping', mapping);
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', 'preferred_color_scheme');
    script.setAttribute('data-lang', 'ru');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    if (term) {
      script.setAttribute('data-term', term);
    }

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
  }, [repo, repoId, category, categoryId, mapping, term]);

  return (
    <section className="mt-12 border-t pt-6">
      <h3 className="mb-4 text-lg font-semibold">Комментарии</h3>
      {failed && !loaded && (
        <div className="rounded-lg border bg-fd-secondary/50 p-4 text-sm text-fd-muted-foreground">
          <p>Автор не настроил обсуждения для этого поста.</p>
          <p className="mt-1">
            Вы можете обсудить пост на{' '}
            <a
              href={`https://github.com/${repo}/discussions`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-fd-primary transition-colors hover:text-fd-primary/80"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      )}
      <div ref={containerRef} className="min-h-[120px]" />
    </section>
  );
}
