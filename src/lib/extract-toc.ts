import type { TOCItemType } from 'fumadocs-core/toc';

export function extractTOC(markdown: string): TOCItemType[] {
  const lines = markdown.split('\n');
  const items: TOCItemType[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = /^(#{2,3})\s+(.+)$/.exec(line);
    if (!match) continue;

    const level = match[1].length;
    const title = match[2].trim();
    const url = '#' + title
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-');

    items.push({
      title,
      url,
      depth: level,
    });
  }

  return items;
}