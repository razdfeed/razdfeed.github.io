# План: AI-кнопки на странице поста + рабочий Markdown-эндпоинт для /docs

- **Тип:** feature + fix
- **Ветка:** main (без переключения)
- **Создан:** 2026-10-26
- **Режим:** fast

## Original Request

сделай кнопку на странице есть кнопка в fumadocs - копировать как промпт

почему-то ее нет

https://razdfeed.github.io/dealenx/gh-6/

## Settings

- **Testing:** no
- **Logging:** verbose
- **Docs:** no
- **Roadmap:** none (файла `.ai-factory/ROADMAP.md` нет)

## Ответы на вопросы

- Поведение: **две кнопки копирования + поповер «Открыть»** (ChatGPT / Claude / Cursor / Scira / GitHub).
- `/docs` 404: **чиним в этом же плане.**

## Диагноз (проверено)

1. `MarkdownCopyButton` / `ViewOptionsPopover` используются **только** в `src/app/docs/[[...slug]]/page.tsx:28-35`. Страницу поста рендерит `BlogPostClient` (`src/components/blog-client.tsx:524-698`) — там этих элементов нет вообще.
2. В `@fumadocs/base-ui` (установлена `16.12.1`, последняя `16.17.8`) **нет** кнопки «Copy as prompt». Есть `MarkdownCopyButton` (fetch markdown) и `ViewOptionsPopover` (пункты «Open in ChatGPT/Claude/Cursor/Scira/GitHub», промпт передаётся в URL чата как `Read {url}, I want to ask questions about it.`). Кнопка «Copy Instructions» на fumadocs.dev — их собственный локальный компонент, не часть пакета. Поэтому «копировать как промпт» надо собирать из `useCopyButton` + `buttonVariants` (оба экспортируются пакетом, subpath-импорты резолвятся).
3. В `src/lib/source.ts:13-26` уже есть `getPageMarkdownUrl` и `getLLMText`, но роута, который их отдаёт, нет: `src/app/llms.mdx/**` отсутствует, `out/llms.mdx` после сборки тоже нет. Итог на живом сайте: `/llms.mdx/docs/rules/content.md` → **404**, `/llms.txt` → 404. `MarkdownCopyButton` в `16.12.1` делает `fetch(...).then(r => r.text())` **без проверки `res.ok`**, т.е. сейчас «Copy Markdown» на `/docs/` копирует HTML 404-страницы.
4. `output: 'export'` (`next.config.mjs:9`) route handlers поддерживает: проверил минимальным проектом на том же `next@16.2.11` — `export const dynamic = 'force-static'` + `generateStaticParams` дают обычные файлы `out/llms.mdx/docs/rules/content.md` и `out/llms.mdx/docs/content.md` (никаких `.body`/`.meta`), `curl` по ним вернёт 200. Значит эндпоинт для `/docs` делается без смены режима сборки и без сервера.
5. `basePath` на CI пустой (`GITHUB_REPOSITORY=razdfeed/razdfeed.github.io` → имя репозитория совпадает с `<user>.github.io`), `withBasePath` внутри `MarkdownCopyButton` добавляет `import.meta.env.BASE_URL` = `/` — URL `/llms.mdx/docs/...` отдаётся с корня. Путь `/dealenx/gh-6/` — это author/slug, а не basePath.

## Решения

- Markdown поста берём **из уже загруженных данных на клиенте** (`post.body`), без нового эндпоинта и без 497 лишних файлов в `out/`.
- URL для промпта — канонический `https://razdfeed.github.io/<author>/<slug>/`, а не `usePathname()` (не зависит от trailing slash и basePath).
- Поповер — готовый `ViewOptionsPopover`, `githubUrl` только для GitHub-постов (`post.sourceRepo`), для Telegram-постов без `githubUrl`. `markdownUrl` не передаём, пока нет md-эндпоинта постов.
- Для `/docs` роут отдаёт уже существующий `getLLMText(page)` — новый код не нужен, только 8-10 строк route-файла.

## Skipped (сознательно вне рамок)

- Апгрейд `fumadocs-ui` 16.12.1 → 16.17.8. Он дал бы `res.ok`-проверку и состояние «Copied Markdown», но тянет за собой весь пакет; после Task 1 404 уходит сам.
- `llms.txt` / `llms-full.txt` — отдельная задача, кнопке не нужны.
- Пункт «View as Markdown» для постов внутри поповера — потребовал бы md-эндпоинт по всем 497 постам.
- `proxy.ts` (rewrite `*.md` → `content.md`) в `output: 'export'` не исполняется; не трогаем, файл остаётся как есть.

## Tasks

### Phase 1: Markdown-эндпоинт для /docs

- [ ] **Task 1** — создать `src/app/llms.mdx/docs/[[...slug]]/route.ts`:
  ```ts
  import { notFound } from 'next/navigation';
  import { getLLMText, source } from '@/lib/source';

  export const dynamic = 'force-static';

  export function generateStaticParams() {
    return source.generateParams().map((p) => ({ slug: [...p.slug, 'content.md'] }));
  }

  export async function GET(_req: Request, ctx: { params: Promise<{ slug?: string[] }> }) {
    const { slug } = await ctx.params;
    const page = source.getPage((slug ?? []).slice(0, -1));
    if (!page) notFound();
    return new Response(await getLLMText(page), {
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
  }
  ```
  - Путь `llms.mdx/docs` совпадает с `docsContentRoute` (`src/lib/shared.ts:3`) и с `getPageMarkdownUrl` (`src/lib/source.ts:13`) — менять генератор URL не нужно.
  - Корневая страница: `slugs=[]` → `content.md` → `source.getPage([])`; проверено, что такой параметр экспортируется в `out/llms.mdx/docs/content.md`.
  - Тип `params` пишем инлайном, а не `RouteContext<'/llms.mdx/docs/[[...slug]]'>`: литерал генерируется `next typegen` не всегда предсказуемо, лишняя зависимость от типа. Если `types:check` подскажет готовый хелпер — заменить на него.
  - Лог: `console.info('[md] %s', page.url)` перед возвратом (verbose; видно в логе `Build` в Actions, по строке на страницу).
  - Проверка: `bun run build` → в `out/llms.mdx/docs/` лежат `content.md`, `connect/content.md`, `rules/content.md`; `python3 -m http.server` из `out` + `curl -i localhost:8000/llms.mdx/docs/rules/content.md` → 200 и заголовок `# …` в теле.

### Phase 2: Кнопки на странице поста

- [ ] **Task 2** — создать `src/components/post-actions.tsx` (новый, `'use client'`), экспорт `PostActions({ post }: { post: FeedPost })` (зависит от 1 не нужен, но ставим после — общий этап проверки):
  ```tsx
  const url = `https://razdfeed.github.io/${post.authorLogin}/${post.slug}/`;
  const prompt = `Read ${url}, I want to ask questions about it.`;
  const markdown = `# ${post.title}\n\n> ${post.authorName ?? post.author} · ${post.createdAt}\n\n${post.body}\n\nИсточник: ${post.url}\n`;
  ```
  - Две кнопки через `useCopyButton` (`fumadocs-ui/utils/use-copy-button`) + `buttonVariants({ variant: 'secondary', size: 'sm' })` (`fumadocs-ui/components/ui/button`), иконки `Copy` / `Check` из `lucide-react`; показывать `Check` пока `checked === true`.
  - Подписи — как в fumadocs (сайт уже показывает их по-английски на `/docs/`): `Copy Prompt` и `Copy Markdown`.
  - Третий элемент — `<ViewOptionsPopover githubUrl={post.sourceType === 'telegram' ? undefined : post.url} />`. `post.url` у GitHub-поста — это ссылка на обсуждение (`https://github.com/dealenx/dealenx/discussions/6`), что и есть «источник»; у Telegram-поста `post.url` — `t.me/...`, поэтому `githubUrl` не передаём и пункт «Open in GitHub» просто не отрисуется. `markdownUrl` не передавать (см. Skipped).
  - Обёртка: `<div className="flex flex-wrap items-center gap-2">`.
  - Логи: `console.info('[post-actions] copy prompt %s', url)` и `console.info('[post-actions] copy markdown %s (%d chars)', post.slug, markdown.length)` — клиентские, только по клику.
  - Отдельный файл, а не инлайн в `blog-client.tsx` (там уже 698 строк) — компонент тестируется/меняется независимо.
  - Проверка: `bun run types:check`.

- [ ] **Task 3** — вставить блок в `src/components/blog-client.tsx`, в `BlogPostClient`, между блоком `post.forwardedFrom` и `<DocsBody>` (сейчас ~строка 622):
  ```tsx
  <div className="mb-4 border-b pb-4">
    <PostActions post={post} />
  </div>
  ```
  - Импорт `import { PostActions } from '@/components/post-actions';` рядом с остальными.
  - Строка действий идёт **над** телом поста и ниже шапки автора — как в fumadocs (действия под описанием, над контентом). Существующий `border-b pb-6` у шапки автора не трогаем.
  - Лог: ничего нового (клиентский рендер; факт отсутствия/наличия кнопок проверяется в Task 4).

### Phase 3: Проверка

- [ ] **Task 4** — сквозная проверка (зависит от 1, 2, 3):
  - `bun run types:check` — без ошибок.
  - `bun run build`, затем в `out/`:
    - `ls out/llms.mdx/docs/*/content.md` → 3 файла (index, connect, rules);
    - `grep -c "Copy Markdown" out/docs/rules/index.html` → `1` (кнопка на месте);
    - `python3 -m http.server` из `out` + `curl -i localhost:8000/llms.mdx/docs/rules/content.md` → 200, `content-type: text/markdown`, в теле `# Правила`.
  - `bun run dev` → `browser.open` на `http://localhost:3000/dealenx/gh-6/`: видны три элемента (Copy Prompt, Copy Markdown, Open); клик по «Open» показывает меню с «Open in GitHub / ChatGPT / Claude / Cursor»; клик по «Copy Prompt» кладёт в буфер `Read https://razdfeed.github.io/dealenx/gh-6/, I want to ask questions about it.` (проверить через `tab.run` → `navigator.clipboard.readText()`).
  - Регресс: `/dealenx/` (страница автора) и `/` (лента) не показывают новых кнопок, не падают.

## Риски

- `generateStaticParams` в route handler + `params` в `GET`: если Turbopack соберёт роут как динамический, `next build` упадёт с «Route couldn't be rendered statically». Лечится `export const dynamic = 'force-static'` (в тестовом проекте на той же версии Next этого достаточно).
- GitHub Pages отдаст `.md` файл с MIME, который он выберет сам (`text/markdown` или `text/plain`). Для `fetch().text()` это неважно; для прямой навигации в браузере — покажет текстом, что и требуется.
- `ViewOptionsPopover` в `16.12.1` не берёт `res.ok` и берёт `usePathname()` для промпта; для страницы поста это корректный путь, но если позже понадобится канонический URL — только через апгрейд пакета.
