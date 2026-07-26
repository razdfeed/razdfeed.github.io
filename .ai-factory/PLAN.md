# Plan: docs-style homepage layout

## Goal
Redesign the homepage (`/`) to use a documentation-style two-column layout similar to Fumadocs docs: a fixed left sidebar with logo, search and navigation items, and a right content area where posts are rendered without card backgrounds, separated only by horizontal lines.

## Files to change
1. `src/app/(home)/layout.tsx` — replace top-nav `HomeLayout` with `DocsLayout` from Fumadocs, passing our own sidebar content.
2. `src/components/sidebar-nav.tsx` — enhance with logo + search trigger at the top, keep navigation items.
3. `src/components/blog-client.tsx` — switch from three-column layout to two-column (sidebar + main), remove right `SiteAuthors` column, keep consistent skeletons.
4. `src/components/post-card.tsx` — remove card background/border/shadow, replace with a flat item separated by `border-b`.
5. `src/components/skeleton-card.tsx` — update skeletons to flat line-separated style.

## Implementation notes
- Use Fumadocs `DocsLayout` from `fumadocs-ui/layouts/docs`. It accepts `tree` (page tree), `sidebar.banner` / `sidebar.footer` and `slots.sidebar` overrides. We can pass an empty tree to keep it from rendering a docs page tree and supply `slots.sidebar.root` with our own `SidebarNav`.
- Hide the docs header entirely by overriding `slots.header` to a no-op component, because the design in the screenshot has no top bar.
- Search trigger in the sidebar can reuse Fumadocs `<SearchToggle />` from `fumadocs-ui/components/layout/search-toggle` or a simple styled button. We'll use `fumadocs-ui/components/layout/search-toggle` if exported, otherwise a custom search button that opens Fumadocs search dialog via the exported trigger. The project already uses `SearchTrigger` in `fumadocs-ui/dist/layouts/shared/slots/search-trigger.js`; the public export is `fumadocs-ui/components/layout/search-toggle`.
- Keep `baseOptions()` so theme switch / search config from shared layout is preserved.
- Make sure mobile experience still works: `DocsLayout` sidebar has a trigger on mobile.
- Posts: remove `rounded-lg border bg-fd-card p-4 shadow-sm`, keep padding via `py-6`, add `border-b border-fd-border last:border-b-0`.
- Keep all existing behaviour: expand/collapse, preview image, load more, author avatars, links.
- Load-more button: change to flat ghost style (`text-fd-primary hover:text-fd-primary/80`) instead of card button.
- Remove unused `SiteAuthors` import from `blog-client.tsx` on the homepage (still used elsewhere if needed; it's not used elsewhere, so we can keep it exported but drop usage).

## Verification
- Run `npm run build` and `npm run types:check` after changes.
- Visually check homepage renders sidebar on the left and flat post list on the right.

## Next step
Implement the changes in the files above.
