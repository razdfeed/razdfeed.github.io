/**
 * Server-side helpers for link preview metadata.
 * Must stay free of DOM APIs: metadata is generated during static export.
 */

const IMAGE_MD = /!\[[^\]]*\]\(\s*<?([^)\s>]+)/;
const IMAGE_HTML = /<img[^>]+\bsrc=["']([^"']+)["']/i;

function isAbsoluteUrl(url: string | null | undefined): url is string {
  return !!url && /^https?:\/\//i.test(url);
}

/** First absolute image URL from a post body (markdown or HTML), if any. */
export function firstImageUrl(body: string | null | undefined): string | null {
  if (!body) return null;
  for (const match of [IMAGE_MD.exec(body), IMAGE_HTML.exec(body)]) {
    if (isAbsoluteUrl(match?.[1])) return match[1];
  }
  return null;
}

/**
 * Markdown/HTML body to plain text. Hyphens are kept: stripping them turned
 * "Word-документы" into "Wordдокументы" in every link preview description.
 */
export function toPlainText(body: string | null | undefined): string {
  if (!body) return '';
  return body
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~`\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
