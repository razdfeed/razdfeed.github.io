'use client';

export function TelegramIcon({ url, size = 12 }: { url: string; size?: number }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="Опубликовано через Telegram"
      className="inline-flex cursor-pointer items-center"
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className="text-fd-muted-foreground transition-colors hover:text-fd-foreground"
        aria-hidden="true"
      >
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.467.143a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.008-.033.015-.154-.058-.218s-.185-.043-.265-.025c-.113.025-1.932 1.226-5.454 3.6-.516.354-.983.527-1.4.518-.462-.01-1.35-.26-2.011-.475-.812-.263-1.456-.404-1.397-.858.029-.234.362-.474 1-.72 3.916-1.706 6.526-2.833 7.832-3.378 3.726-1.55 4.5-1.819 5.002-1.827z" />
      </svg>
    </a>
  );
}