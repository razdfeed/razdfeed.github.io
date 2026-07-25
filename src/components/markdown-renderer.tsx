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
        pre: (props) => {
          const child = Array.isArray(props.children)
            ? props.children[0]
            : props.children;
          const codeEl = child as React.ReactElement<{
            className?: string;
            children?: React.ReactNode;
          }>;
          const className = codeEl?.props?.className ?? '';
          const lang = /language-(\w+)/.exec(className)?.[1] ?? 'text';
          const rawChildren = codeEl?.props?.children;
          const code = Array.isArray(rawChildren)
            ? rawChildren.join('')
            : String(rawChildren ?? '');

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