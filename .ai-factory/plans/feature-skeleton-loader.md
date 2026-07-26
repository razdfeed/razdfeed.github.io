# Plan: Skeleton Loader — анимированная загрузка без текста

- **Branch:** main (без переключения)
- **Created:** 2026-07-26
- **Mode:** full (no-git-switch)
- **Testing:** нет
- **Logging:** verbose
- **Docs:** warn-only

## Original Request

skeleton-loader

## Settings

| Setting | Value |
|---------|-------|
| Testing | нет — UI-визуальная фича, проверяется визуально |
| Logging | Verbose — DEBUG-логи для всех loading-состояний |
| Docs | warn-only — `WARN [docs]` без обязательного checkpoint |

## Tasks

### Task 1: Shimmer keyframes + utility class в global.css ✅

**Файл:** `src/app/global.css`

Добавить shimmer-анимацию (волна градиента слева→справа) через Tailwind v4 CSS-first подход — `@theme` блок с `--animate-shimmer` и `@keyframes shimmer`.

**Что добавить:**
```css
@theme {
  --animate-shimmer: shimmer 1.8s ease-in-out infinite;
}

@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

Создать utility-класс `.skeleton-shimmer` — `bg-gradient-to-r from-fd-muted/50 via-fd-muted to-fd-muted/50 bg-[length:200%_100%]` + `animate-shimmer`.

Заменить все `bg-fd-muted animate-pulse` на `skeleton-shimmer` в проекте.

**Логирование:** без логов (CSS-only).

---

### Task 2: Фиксация размеров в PostCard ✅

**Файл:** `src/components/post-card.tsx`

Добавить стабильные размеры, чтобы реальная карточка совпадала по габаритам со skeleton:

1. **Preview image** (line 78–85): добавить `aspect-video` на `<img>` → всегда 16:9 пропорция
2. **Title** (line 73–75): добавить `line-clamp-2` → максимум 2 строки
3. **Card root** (line 45): добавить `min-h-[280px]` → страховка минимальной высоты
4. **Preview container** (line 78): добавить `aspect-video` чтобы контейнер тоже имел пропорцию

**Логирование:** оставить существующий `console.debug('[PostCard] render:...')` без изменений.

---

### Task 3: Reusable SkeletonCard component ✅

**Файл:** `src/components/skeleton-card.tsx` (новый)

Создать компонент `<SkeletonCard />` повторяющий структуру `PostCard` 1:1, но с shimmer-плейсхолдерами вместо реального контента:

```
<article className="rounded-lg border bg-fd-card p-4 shadow-sm min-h-[280px]">
  <header className="mb-3 flex items-center gap-3">
    <div className="h-9 w-9 rounded-full skeleton-shimmer" />
    <div className="flex flex-col gap-1">
      <div className="h-4 w-32 rounded skeleton-shimmer" />
      <div className="h-3 w-20 rounded skeleton-shimmer" />
    </div>
  </header>
  <div className="mb-4">
    <div className="h-6 w-3/4 rounded skeleton-shimmer" />
  </div>
  <div className="mb-4 aspect-video w-full overflow-hidden rounded-lg">
    <div className="h-full w-full skeleton-shimmer" />
  </div>
  <div className="h-4 w-40 rounded skeleton-shimmer" />
</article>
```

Также создать `<SkeletonPopularPosts />` для правой колонки и `<SkeletonSidebar />` для левой.

**Логирование:** `console.debug('[SkeletonCard] render')` при mount.

---

### Task 4: HomePageClient — shimmer skeleton + fade-in ✅

**Файл:** `src/components/blog-client.tsx`

Заменить loading-блок `HomePageClient` (lines 187–227):

1. Использовать `<SkeletonCard />`, `<SkeletonPopularPosts />`, `<SkeletonSidebar />` вместо inline `animate-pulse` блоков
2. На блок с реальными постами добавить `animate-fd-fade-in` (есть в fumadocs-ui) при появлении
3. Сохранить трёхколоночную структуру (`flex gap-6` → sidebar / main / popular)

**Логирование:** оставить существующие `console.debug('[HomePageClient] ...')`, добавить `[HomePageClient] skeleton rendered`.

---

### Task 5: loadMore — skeleton вместо текста "Загрузка…" ✅

**Файл:** `src/components/blog-client.tsx`

Заменить кнопку "Показать ещё" + текст "Загрузка…" (lines 267–277):

1. При `loadingMore === true` рендерить 2–3 `<SkeletonCard />` вместо кнопки с текстом
2. При `loadingMore === false` и `nextPage` — рендерить кнопку "Показать ещё" (без текста загрузки)
3. Добавить `animate-fd-fade-in` на новые реальные посты после завершения loadMore

**Логирование:** оставить существующие `console.debug('[HomePageClient] loading more...')`.

---

### Task 6: AuthorsPageClient — shimmer skeleton ✅

**Файл:** `src/components/blog-client.tsx`

Заменить loading-блок `AuthorsPageClient` (lines 312–329):

1. Заменить `animate-pulse` на `skeleton-shimmer` классы
2. Или создать `<SkeletonAuthorRow />` компонент

**Логирование:** оставить `console.debug('[AuthorsPageClient] loading authors')`.

---

### Task 7: AuthorPageClient — shimmer вместо "Загрузка…" ✅

**Файл:** `src/components/blog-client.tsx`

Заменить loading-блок `AuthorPageClient` (lines 418–426):

1. Убрать текст "Загрузка…"
2. Рендерить skeleton: аватар 64×64 + имя + список из 3–4 skeleton-строк
3. Структура должна совпадать с реальной страницей автора (header + post list)

**Логирование:** добавить `console.debug('[AuthorPageClient] skeleton rendered')`.

---

### Task 8: BlogPostClient — shimmer вместо "Загрузка…" ✅

**Файл:** `src/components/blog-client.tsx`

Заменить loading-блок `BlogPostClient` (lines 531–539):

1. Убрать текст "Загрузка…"
2. Рендерить skeleton: breadcrumb + заголовок (`h-8 w-3/4`) + автор/дата + `prose`-плейсхолдер (несколько строк разной ширины)
3. Использовать `skeleton-shimmer` классы

**Логирование:** добавить `console.debug('[BlogPostClient] skeleton rendered')`.

---

### Task 9: Typecheck ✅

**Команда:** `npm run types:check`

Проверить что все изменения проходят TypeScript без ошибок.

---

## Commit Plan

Один коммит после всех задач:

```
feat: add shimmer skeleton loaders across all pages

Replace plain "Загрузка…" text and animate-pulse with animated shimmer
skeletons. Fix PostCard dimensions (aspect-video, line-clamp-2) to
prevent layout jumps. Add fade-in transitions on content appearance.
```