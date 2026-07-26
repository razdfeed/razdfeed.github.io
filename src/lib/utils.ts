/**
 * razdfeed shared client utilities.
 */

export function formatDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function extractPreviewImage(html: string): string | null {
  if (typeof window === 'undefined') return null;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const img = doc.querySelector('img');
  const src = img?.getAttribute('src') ?? null;
  if (src) {
    console.debug('[extractPreviewImage] found:', src);
  } else {
    console.debug('[extractPreviewImage] no preview image');
  }
  return src;
}

export function extractPlainText(html: string, maxLength = 200): string {
  if (typeof window === 'undefined') return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const text = (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
}
