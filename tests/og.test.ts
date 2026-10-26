import { test, expect } from 'bun:test';
import { firstImageUrl, toPlainText } from '../src/lib/og';

test('firstImageUrl prefers the first absolute markdown image', () => {
  const body =
    '\n![Обложка](https://raw.githubusercontent.com/dealenx/dealenx/main/articles/typst-vs-word/cover.jpg)\n\nтекст';
  expect(firstImageUrl(body)).toBe(
    'https://raw.githubusercontent.com/dealenx/dealenx/main/articles/typst-vs-word/cover.jpg',
  );
});

test('firstImageUrl reads HTML img src', () => {
  expect(
    firstImageUrl(
      '<img width="1536" alt="image" src="https://github.com/user-attachments/assets/25b20584">',
    ),
  ).toBe('https://github.com/user-attachments/assets/25b20584');
});

test('firstImageUrl rejects relative and empty sources', () => {
  expect(firstImageUrl('![x](/local/a.png)')).toBeNull();
  expect(firstImageUrl('<img src="./a.png">')).toBeNull();
  expect(firstImageUrl('без картинок')).toBeNull();
  expect(firstImageUrl(null)).toBeNull();
});

test('toPlainText keeps hyphens and drops markup', () => {
  const text = toPlainText(
    '![cover](https://x/y.png)\n\n**Видео-формат:** [yt](https://y.com/x)\n\nWord-документы для ИИ-агентов.',
  );
  expect(text).toContain('Word-документы для ИИ-агентов');
  expect(text).not.toContain('![cover]');
  expect(text).not.toContain('https://y.com/x');
  expect(text).not.toContain('**');
});

test('toPlainText returns empty string for missing body', () => {
  expect(toPlainText(undefined)).toBe('');
});
