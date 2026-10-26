# План: посты не появляются на сайте (сайт не пересобирается)

**Тип:** fix (инфраструктура деплоя)
**Создан:** 2026-10-26
**Режимы:** fast, без git-ветки

## Original Request
(план создан из `/aif-explore`: разбор «почему не видно статьи https://razdfeed.github.io/dealenx/gh-6», указан баг в `/home/dealenx/Projects/sandbox/fetcher-collector`)

## Диагноз
`razdfeed.github.io` — статический экспорт Next.js (`output: 'export'`), маршруты постов создаются в
`generateStaticParams` (`src/app/[...path]/page.tsx`). HTML заморожен на **2026-09-29T22:36**
(`sitemap.xml` max `lastmod`, последний прогон `Deploy to GitHub Pages`, sha `95680af`).

Причина: workflow **`.github/workflows/deploy.yml` в `razdfeed/razdfeed.github.io` имеет состояние
`disabled_inactivity`** — GitHub отключает cron в публичном репо после 60 дней без активности.
Последний коммит сайта — 2026-07-31 (ровно +60 дней = 29.09).

Данные при этом живые: `fetcher-collector` публикует `public/data/*` на своём Pages каждые ~20 мин
(`authors.json` → `dealenx` 166 постов, `gh-6` первым; `posts-1.json` `generatedAt 2026-10-26T09:53`).
`/dealenx/` рисует пост через клиентский `fetchAuthorPosts`, а клик ведёт на статический
`/dealenx/gh-6/index.html`, которого нет → 404. То же у `wangel13/tg-334` (25.10).

Усилители:
- `f783d58` (29.07) убрал cross-repo `repository_dispatch` из коллектора — единственный мост
  «данные обновились → сайт пересобрался» пропал, остался только cron сайта.
- Cron сайта объявлен `*/10`, реально давал 4–6 прогонов в сутки (GitHub режет `schedule`), т.е.
  даже живой cron не давал свежести быстрее нескольких часов.

## Settings
- Testing: no — в обоих репозиториях нет тест-раннера; проверка через smoke-команды (curl/gh)
- Logging: standard
- Docs: yes — обновить README коллектора (поток данных → пересборка сайта) и комментарий в workflow

## Research Context
(пропущено — `.ai-factory/RESEARCH.md` не создавался, план опирается на исследование в сессии и
живые данные GitHub API по состоянию на 2026-10-26)

## Commit Plan
- **Commit 1** (сайт, задачи 1, 2, 5): `fix(ci): rebuild on repository_dispatch, guard empty data payload`
- **Commit 2** (коллектор, задачи 3, 6): `fix(ci): trigger site rebuild after data deploy`

Задача 4 — операционная (секрет), коммита не даёт.

## Tasks

### Phase 1: Разблокировать сейчас (ops, без изменений кода)
- [x] **Task 1** — включить workflow сайта и пересобрать страницы.
  - `gh workflow enable deploy.yml -R razdfeed/razdfeed.github.io`
  - `gh workflow run deploy.yml -R razdfeed/razdfeed.github.io`
  - Дождаться зелёного прогона, проверить: `curl -o /dev/null -w '%{http_code}' https://razdfeed.github.io/dealenx/gh-6/` → `200`, и `curl -s https://razdfeed.github.io/sitemap.xml | grep -c dealenx/gh-6` → `1`.
  - Лог: вывод `gh run list -R razdfeed/razdfeed.github.io -L 3`.

### Phase 2: Сайт (`razdfeed/razdfeed.github.io`)
- [x] **Task 2** — триггер по событию вместо мёртвого cron. Файл `.github/workflows/deploy.yml`.
  - Добавить в `on:` блок `repository_dispatch: types: [data-updated]`.
  - Заменить `schedule: cron: '*/10 * * * *'` на суточный safety-net `cron: '30 4 * * *'` (комментарий: основной триггер — `repository_dispatch` из коллектора, cron — страховка).
  - Прочее (`push`, `workflow_dispatch`, permissions, concurrency) не трогать.
  - Лог: имя события видно в `gh run list --json event` — прогон после dispatch должен иметь `event: repository_dispatch`.

- [x] **Task 5** — не деплоить пустой сайт. Файл `src/app/[...path]/page.tsx`, `generateStaticParams`.
  - Если `posts.length === 0` и `process.env.CI` — `throw new Error('No posts fetched from data API — refusing to generate an empty site')`. Сейчас `fetchJson` глотает ошибки (`return null`) и сайт молча собирается без постов.
  - Fallback `_author` для локальной разработки оставить.
  - Лог: текст исключения попадёт в лог шага `Build`, этого достаточно.

### Phase 3: Коллектор (`razdfeed/fetcher-collector`)
- [ ] **Task 4** (ops, до Task 3) — секрет для dispatch.
  - Создать fine-grained PAT: доступ только к `razdfeed/razdfeed.github.io`, permission **Contents: Read and write**, срок ≤ 1 год.
  - `gh secret set WEBSITE_DISPATCH_TOKEN -R razdfeed/fetcher-collector`
  - Лог: `gh secret list -R razdfeed/fetcher-collector` показывает имя секрета.

- [x] **Task 3** — вернуть dispatch, но с видимым падением. Файл `.github/workflows/deploy.yml`.
  - В job `collect-and-deploy` после шага `Deploy to GitHub Pages` добавить шаг `Trigger site rebuild`:
    ```yaml
    - name: Trigger site rebuild
      if: github.event_name == 'schedule' || github.event_name == 'workflow_dispatch'
      env:
        TOKEN: ${{ secrets.WEBSITE_DISPATCH_TOKEN }}
      run: |
        curl --fail-with-body -sS -X POST \
          -H "Accept: application/vnd.github+json" \
          -H "Authorization: Bearer $TOKEN" \
          -H "X-GitHub-Api-Version: 2022-11-28" \
          https://api.github.com/repos/razdfeed/razdfeed.github.io/dispatches \
          -d '{"event_type":"data-updated"}'
    ```
  - Отличие от откаченного `462e00d`: `--fail-with-body` (было `curl -L` без `--fail` — 401/404 проходили молча, что и стало причиной «не работает» → реверта).
  - Пустой `WEBSITE_DISPATCH_TOKEN` → `::warning::` + `exit 0` (иначе прогоны красные каждые 20 минут до создания секрета). Заданный, но отклонённый токен → `curl` с `--fail-with-body` роняет job.
  - Лог: шаг печатает ответ API (204 = ок) либо тело ошибки и роняет job.

### Phase 4: Документация
- [x] **Task 6** — README коллектора: в раздел «Принцип работы» добавить п.5 «после деплоя данных отправляет `repository_dispatch` (`data-updated`) в `razdfeed/razdfeed.github.io`», с пометкой про `WEBSITE_DISPATCH_TOKEN`.

## Проверка (smoke, после реализации)
1. `gh workflow run deploy.yml -R razdfeed/fetcher-collector` → зелёный прогон, шаг `Trigger site rebuild` = 204.
2. `gh run list -R razdfeed/razdfeed.github.io -L 1 --json event,conclusion` → `repository_dispatch`, `success`.
3. `curl -o /dev/null -w '%{http_code}' https://razdfeed.github.io/dealenx/gh-6/` → `200`.
4. Новый пост после этого прогона (например обновить discussion) появляется как отдельная страница без ручных действий.

## Риски
- Fine-grained PAT истекает (максимум 1 год) — по истечении dispatch начнёт падать с 401, job станет красным (это и есть желаемое поведение вместо тихой деградации). Дата в комментарии к секрету.
- `repository_dispatch` не «оживляет» отключённый по неактивности repo-таймер сам по себе — но каждый dispatch создаёт прогон, т.е. активность; суточный cron остаётся страховкой.
- Полная пересборка сайта ~6 раз в сутки (столько реально прогонов у коллектора) — та же нагрузка, что была до 29.09.
