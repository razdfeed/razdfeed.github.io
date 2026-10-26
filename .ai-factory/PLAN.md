# План: превью ссылок в Telegram (og:image для всех страниц)

- **Тип:** fix (SEO / метаданные)
- **Ветка:** main (без переключения)
- **Создан:** 2026-10-26

## Original Request

можно ли настроить чтобы можно было выводить превью?

Учитывая что картинка работает
то есть если я отправляю ссылку в мессенджер телеграм то чтобы выводило превью картинки если она есть или выводить иначе логотип razdfeed

## Диагноз (проверено curl'ом по живому сайту и по данным коллектора)

1. `og:image` отсутствует у **154 из 497** собранных страниц: `/` , `/dealenx/gh-2/`, `/dealenx/gh-3/`, `/dealenx/gh-6/`, 142 телеграм-поста без картинок, 4 страницы `mimikkai`, 67 `wangel13`, `404`.
2. Причина №1 — `images: undefined` в `openGraph`. Next сливает метаданные неглубоко: объект `openGraph` страницы **целиком** замещает родительский из `src/app/layout.tsx`, поэтому дефолт `['/logo.png']` не наследуется. Доказательство: в `out/index.html` есть `twitter:image` (страница объявила `openGraph`, но не `twitter`) и нет `og:image`; на страницах постов отсутствуют `og:site_name` / `og:locale` из layout.
3. Причина №2 — источник картинки слишком узкий (`src/app/[...path]/page.tsx:118`): только `post.media.images[0]` и `post.linkPreview.image`. Обложка из тела поста не читается → `gh-6` (обложка `raw.githubusercontent.com/.../cover.jpg`, отдаётся 200 `image/jpeg`) остаётся без превью. По данным 487 постов: 118 `media[0]`, 216 `linkPreview.image`, **11** только тело (`gh-6`, `gh-3`, `gh-2`, 8× YouTube), **142** вообще без картинки.
4. Попутно: `/docs/*` объявляет `og:image: https://razdfeed.github.io/og/docs/image.webp` → **404** (route `og/docs` в проекте не существует, `getPageImageUrl` из `src/lib/source.ts` генерирует битый URL). Telegram такую картинку просто не покажет.
5. Попутно: `description` собирается через `.replace(/[#>*_~`\\-]/g, '')` — вырезаются дефисы: в `gh-6` уже видно «Wordдокументы», «ИИагентов». Задевает 357 из 487 постов.

Telegram читает только `<meta>` из HTML, JS не исполняет; кэш превью — **по URL страницы**, а не по картинке (уже отправленная ссылка останется без превью до `@WebpageBot`).

## Settings

- Testing: yes, standard — один файл `tests/og.test.ts` на `bun test` (раннера в репо нет, добавлять CI-шаг не нужно)
- Logging: verbose — по одной строке `console.info` на страницу в момент `generateMetadata` (видно в логе `Build` в Actions), с указанием выбранного источника картинки
- Docs: no

## Skipped (сознательно вне рамок)

- `og:site_name` / `og:locale`, перетёртые на страницах постов — на вид карточки в Telegram не влияют (домен показывается и так), правка отдельная.
- Генерация персональных карточек с заголовком через `takumi-js` (зависимость уже стоит, но не используется) — даёт разные картинки для 142 «текстовых» постов; дороже по времени билда, отдельная задача.
- `og:image` для видео-постов без картинки (33 шт.) — попадут на дефолтную карточку, как и прочие.

## Tasks

### Phase 1: Хелперы и дефолтная карточка

- [x] **Task 1** — `src/lib/og.ts`: чистые серверные хелперы (без `DOMParser`, чтобы работали в статическом экспорте).
  - `firstImageUrl(body?: string | null): string | null` — первая картинка тела: markdown `![alt](URL)` или HTML `<img src="URL">`; принимать **только** абсолютные `http(s)` (относительный путь в `og:image` бесполезен для Telegram → `null`).
  - `toPlainText(body?: string | null): string` — текущая логика очистки из `page.tsx`, но без вырезания дефисов: класс `/[#>*_~`\\]/g` вместо `/[#>*_~`\\-]/g`, картинки и ссылки вырезаются **до** снятия тегов.
  - `DEFAULT_OG_IMAGE = '/og-default.jpg'` — в `src/lib/shared.ts` (там уже живут общие константы), не в `og.ts`, чтобы его же импортировали layout/home/docs.
  - Проверка кода: `bun run types:check` проходит. Для этого в `tsconfig.json` добавить `"tests"` в `exclude` (рядом с `"scripts"`): `@types/bun` в проекте нет, иначе `tsc` упадёт на `import { test } from 'bun:test'`.
  - Лог: ничего (чистые функции).

- [x] **Task 2** — `public/og-default.jpg`: дефолтная карточка 1200×630 (~92 КБ), чёрный фон `#0a0a0a`, логотип по центру. Воспроизводимая команда (уже прогнана, результат просмотрен):
    ```bash
    magick public/logo-with-bg.png -resize 560x560 -background '#0a0a0a' \
      -gravity center -extent 1200x630 -strip -quality 86 -sampling-factor 4:2:0 \
      public/og-default.jpg
    ```
  - Именно JPEG, а не `logo.png` (1024×1024 RGBA, 2.1 МБ): квадратный логотип в 1.91:1 Telegram кропает, большой файл медленно тянется краулером.
  - Лог: `identify -format '%wx%h %b' public/og-default.jpg` в момент проверки.

### Phase 2: Метаданные

- [x] **Task 3** — `src/app/[...path]/page.tsx`, `generateMetadata` (зависит от 1, 2):
  - пост: `const ogImage = post.media?.images?.[0] ?? post.linkPreview?.image ?? firstImageUrl(post.body) ?? DEFAULT_OG_IMAGE;`
  - `openGraph.images` и `twitter.images` **всегда** `[ogImage]` — `undefined` больше не возвращается (иначе объект снова перетирает layout).
  - автор: `images: [author.avatar || DEFAULT_OG_IMAGE]` в обоих блоках.
  - `description`: `const bodyClean = toPlainText(post.body);` (дефисы сохраняются).
  - `console.info('[og] %s -> %s', `${authorLogin}/${slug}`, источник)` в конце ветки поста; источник — одно из `media`, `linkPreview`, `body`, `default`.
  - Лог: в выводе `next build` должно быть ровно по строке `[og] ...` на каждый пост, значение `default` — только у постов без картинки.
  - Проверка `gh-6` после билда: `grep -o '<meta property="og:image"[^>]*>' out/dealenx/gh-6/index.html` → `.../articles/typst-vs-word/cover.jpg`.

- [x] **Task 4** — дефолт на страницах без своей картинки (зависит от 1, 2):
  - `src/app/layout.tsx`: `images: [defaultOgImage]` в `openGraph` и `twitter` (сейчас `'/logo.png'`); `icons.icon` оставить `'/logo.png'`.
  - `src/app/(home)/page.tsx`: явные `images: [defaultOgImage]` в `openGraph` и `twitter` — иначе `/` снова теряет `og:image` из-за перетирания.
  - Лог: `grep -o '<meta property="og:image"[^>]*>' out/index.html out/authors/index.html`.

- [x] **Task 5** — `og:image` страниц `/docs/*` указывает на несуществующий `/og/docs/image.webp` (404):
  - `src/app/docs/[[...slug]]/page.tsx`: `images: defaultOgImage`.
  - Удалить мёртвый путь: `getPageImageUrl` из `src/lib/source.ts` и `docsImageRoute` из `src/lib/shared.ts` (используются только там; `getPageMarkdownUrl` / `docsContentRoute` не трогать).
  - Лог: `grep -rn 'og/docs\|getPageImageUrl' src` → пусто.

## Commit Plan

- **Commit 1** (tasks 1–3): `feat(seo): take og:image from post body and always emit a preview card`
- **Commit 2** (tasks 4–5): `fix(seo): default OG card on home, layout and docs; drop broken /og/docs URL`

## Проверка (smoke, после реализации)

1. `bun test tests/og.test.ts` → зелёный: абсолютный markdown/HTML, отказ на относительном URL, `toPlainText` сохраняет дефис.
2. `bun run build` → в логе есть строки `[og]`, билд не падает на guard'е «No posts fetched».
3. `bun run types:check` → без ошибок (при этом `fumadocs-mdx && next typegen` — часть скрипта; если `next typegen` не в состоянии работать без `.next`, ограничиться `bunx tsc --noEmit`).
4. По `out/`:
   - `out/dealenx/gh-6/index.html` → `og:image` = `cover.jpg` (из тела);
   - `out/wangel13/tg-334/index.html` → `og:image` = `cdn4.telesco.pe/...` (из `media`/`linkPreview`);
   - `out/dealenx/gh-2/index.html` → `og:image` = `github.com/user-attachments/...` (HTML `<img>` в теле);
   - `out/index.html`, `out/authors/index.html`, `out/docs/index.html` → `og:image` = `https://razdfeed.github.io/og-default.jpg`;
   - `grep -rL 'og:image' out --include=index.html` → пусто (сейчас `404.html` и `_not-found` уже наследуют картинку из layout; они и служат контролем, что наследование работает, когда `openGraph` не перетирается).
5. После деплоя: старый `https://razdfeed.github.io/dealenx/gh-6/` в Telegram покажет новую карточку только после `@WebpageBot` (кэш по URL) либо в новом чате; проверить `curl -s ... | grep og:image`.

## Риски

- `raw.githubusercontent.com` / `cdn4.telesco.pe` / `github-production-user-asset` отдают картинки ботам (проверено UA `TelegramBot`, 9/10 и 2/2 — 200 `image/jpeg|png`). Но 8 постов с `img.youtube.com` дадут миниатюру YouTube 480×360 — не 1.91:1, Telegram растянет/обрежет.
- Мёртвая ссылка на картинку не ломает карточку: Telegram покажет превью без фото. Падение только если HTML недоступен.
- Если позже захочется уникальные карточки — `takumi-js` уже в зависимостях, `public/og/<author>/<slug>.jpg` генерировать на этапе билда.
