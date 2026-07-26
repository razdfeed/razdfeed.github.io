'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';

function SkeletonImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [zoomed, setZoomed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);

  useEffect(() => {
    if (zoomed) {
      requestAnimationFrame(() => setOverlayVisible(true));
    } else {
      setOverlayVisible(false);
    }
  }, [zoomed]);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomed(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomed]);

  return (
    <>
      <span className="relative block overflow-hidden rounded-lg">
        {!loaded && (
          <span className="skeleton-shimmer aspect-video absolute inset-0" />
        )}
        <img
          {...props}
          className={`relative rounded-lg cursor-zoom-in transition-opacity duration-500 ease-in-out ${loaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onClick={() => setZoomed(true)}
        />
      </span>
      {zoomed && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-8 cursor-zoom-out transition-all duration-300 ${overlayVisible ? 'bg-black/80 opacity-100' : 'bg-black/0 opacity-0'}`}
          onClick={() => setZoomed(false)}
        >
          <img
            {...props}
            className={`max-h-full max-w-full rounded-lg object-contain transition-all duration-300 ${overlayVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            loading="lazy"
          />
        </div>
      )}
    </>
  );
}

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          const code = String(children).replace(/\n$/, '');

          if (match) {
            return (
              <DynamicCodeBlock
                lang={match[1]}
                code={code}
                options={{
                  themes: {
                    light: 'github-light',
                    dark: 'github-dark',
                  },
                }}
              />
            );
          }

          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        pre: ({ children }) => <>{children}</>,
        img: SkeletonImage,
        a: (props) => (
          <a {...props} target="_blank" rel="noopener noreferrer" />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}