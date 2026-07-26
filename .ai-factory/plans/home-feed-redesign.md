# Редизайн главной страницы razdfeed в ленту постов

**Тип:** feature  
**Создан:** 2026-07-26  
**План:** `.ai-factory/plans/home-feed-redesign.md`  
**Режим:** full (без git switch, no-branch)  

## Original Request
Сделать главную страницу как на референсе VC.ru: лента постов в виде карточек с автором, заголовком, превью картинки, кнопкой «Показать полностью», боковое меню слева, правый сайдбар с популярными статьями.

## Settings
- **Tests:** no
- **Logging:** verbose
- **Docs:** no
- **Roadmap Linkage:** none (skipped by user)

## Analysis
Текущая главная (`src/components/blog-client.tsx` → `HomePageClient`) — это простой список заголовков без карточек и без превью. Данные приходят из `fetcher-collector`: `authors.json` + `posts-{n}.json`. Пост содержит GitHub HTML в `body`, из которого можно извлечь первую картинку для превью.

## Tasks

### Task 1: Создать компонент карточки поста
- **File:** `src/components/post-card.tsx` (new)
- **Deliverable:** Карточка, принимающая `FeedPost` + `author`: аватар+имя автора, заголовок, превью-картинка (если есть), дата, кнопка/ссылка «Показать полностью».
- **Logging:** `console.debug('[PostCard] preview image found:', src)` / `console.debug('[PostCard] no preview image')`.
- **Details:** Парсинг первого `<img src="...">` из `post.body` через `new DOMParser()` на клиенте. Заглушка без превью. Клик по карточке или кнопке ведёт на `/${post.authorLogin}/${post.slug}`.
- **Status:** ✅ done

### Task 2: Создать боковое меню (левая колонка)
- **File:** `src/components/sidebar-nav.tsx` (new)
- **Deliverable:** Вертикальное меню: Лента, Авторы, О проекте, Правила, ссылки на `/`, `/docs/about` (или `/docs`), активный пункт подсвечивается.
- **Logging:** `console.debug('[SidebarNav] active path:', pathname)`.
- **Details:** Использовать `usePathname()` из Next.js. Стили через Tailwind, иконки из `lucide-react`.
- **Status:** ✅ done

### Task 3: Создать правый сайдбар «Популярные статьи»
- **File:** `src/components/popular-posts.tsx` (new)
- **Deliverable:** Компонент, получающий список постов и показывающий 5 топовых по дате (или по комментариям, если данные доступны). Каждый элемент — аватар автора, заголовок, короткая выжимка первых 100 символов тела.
- **Logging:** `console.debug('[PopularPosts] count:', posts.length)`.
- **Details:** Пока нет метрик популярности, сортировать по `createdAt` desc. Выжимка — текст без HTML через `DOMParser`.
- **Status:** ✅ done

### Task 4: Переделать главную страницу под трёхколоночный лейаут
- **File:** `src/components/blog-client.tsx` (modify `HomePageClient`)
- **Deliverable:** Главная разбита на: левый сайдбар ~240px, центральная лента гибкой ширины, правый сайдбар ~320px. Лента отображает посты из `fetchAllPosts()` через `PostCard`. Кнопка/ссылка «Показать ещё» загружает следующую страницу, если `nextPage` не null.
- **Logging:** `console.debug('[HomePageClient] authors loaded:', authors.length)` / `console.debug('[HomePageClient] posts loaded:', posts.length)` / `console.debug('[HomePageClient] loading more, page:', page)`.
- **Details:** Сохранить существующие `AuthorPageClient` и `BlogPostClient`. Для пагинации изменить `fetchAllPosts` так, чтобы можно было загружать постранично, или хранить текущую страницу в стейте. Убрать старый список заголовков.
- **Status:** ✅ done

### Task 5: Адаптировать layout главной
- **File:** `src/app/(home)/layout.tsx`
- **Deliverable:** `HomeLayout` из fumadocs остаётся, но контент страницы не должен иметь внутренний `HomeLayout` (уже убран ранее). Убедиться, что шапка и футер fumadocs не ломают трёхколоночную сетку.
- **Logging:** none.
- **Details:** Проверить `max-w` и `mx-auto` в `HomePageClient` — теперь сетка сама задаёт ширину.
- **Status:** ✅ done

### Task 6: Добавить fallback / empty states
- **File:** `src/components/blog-client.tsx` (modify `HomePageClient`)
- **Deliverable:** Состояния: загрузка, нет постов, ошибка загрузки.
- **Logging:** `console.warn('[HomePageClient] fetch error')`.
- **Details:** Показывать скелетоны или текст «Загрузка…», «Пока нет постов».
- **Status:** ✅ done

### Task 7: Проверить билд и визуально на out/
- **File:** any (verification)
- **Deliverable:** `bun run build` проходит без ошибок. Скриншот/просмотр `out/index.html` показывает ленту.
- **Logging:** `console.log('[Verify] build successful')`.
- **Status:** ✅ done

## Commit Plan
- Commit 1: Tasks 1–3 (новые компоненты карточки, меню, сайдбара) ✅
- Commit 2: Tasks 4–6 (главная, лейаут, empty states)
- Commit 3: Task 7 (verify/fix)

## Next Steps
Продолжить реализацию из `.ai-factory/plans/home-feed-redesign.md`.
