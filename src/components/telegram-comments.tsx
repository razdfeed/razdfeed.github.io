'use client';

import { useEffect, useRef } from 'react';

interface TelegramCommentsProps {
  channel: string;
  postId: number;
}

export function TelegramComments({ channel, postId }: TelegramCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    const widget = document.createElement('script');
    widget.src = 'https://t.me/js/telegram-widget.js?22';
    widget.setAttribute('data-telegram-discussion', `${channel}/${postId}`);
    widget.setAttribute('data-comments-limit', '10');
    widget.setAttribute('data-color', '');
    widget.setAttribute('data-dark', '');
    widget.async = true;

    containerRef.current.appendChild(widget);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [channel, postId]);

  return (
    <div className="mt-12 border-t pt-6">
      <h3 className="mb-4 text-lg font-semibold">Комментарии</h3>
      <div ref={containerRef} className="min-h-[200px]" />
    </div>
  );
}