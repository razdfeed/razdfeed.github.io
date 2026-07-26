'use client';

import { useEffect, useRef } from 'react';

interface TelegramCommentsProps {
  channel: string;
  postId: number;
}

function useDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mq.matches);

    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isDark;
}

import { useState } from 'react';

export function TelegramComments({ channel, postId }: TelegramCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = useDarkMode();

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    const widget = document.createElement('script');
    widget.src = 'https://t.me/js/telegram-widget.js?22';
    widget.setAttribute('data-telegram-discussion', `${channel}/${postId}`);
    widget.setAttribute('data-comments-limit', '10');
    widget.setAttribute('data-color', isDark ? '393939' : 'F2F2F2');
    widget.setAttribute('data-dark', isDark ? '1' : '');
    widget.async = true;

    containerRef.current.appendChild(widget);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [channel, postId, isDark]);

  return (
    <div className="mt-12 border-t pt-6">
      <h3 className="mb-4 text-lg font-semibold">Комментарии</h3>
      <div ref={containerRef} className="min-h-[200px]" />
    </div>
  );
}