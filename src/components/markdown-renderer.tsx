'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';

function ZoomableImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [zoomed, setZoomed] = useState(false);

  return (
    <>
      <img
        {...props}
        className="rounded-lg cursor-zoom-in"
        loading="lazy"
        onClick={() => setZoomed(true)}
      />
      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-zoom-out p-8"
          onClick={() => setZoomed(false)}
        >
          <img
            {...props}
            className="max-h-full max-w-full rounded-lg object-contain"
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
        img: ZoomableImage,
        a: (props) => (
          <a {...props} target="_blank" rel="noopener noreferrer" />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}