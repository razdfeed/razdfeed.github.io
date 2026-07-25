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
        pre: ({ ref: _ref, ...props }) => {
          const codeEl = props.children as React.ReactElement<{
            className?: string;
            children?: string;
          }>;
          const className = codeEl?.props?.className ?? '';
          const lang = className.match(/language-(\w+)/)?.[1] ?? 'text';
          const code = String(codeEl?.props?.children ?? '');

          return (
            <DynamicCodeBlock
              lang={lang}
              code={code}
              options={{
                themes: {
                  light: 'github-light',
                  dark: 'github-dark',
                },
              }}
            />
          );
        },
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