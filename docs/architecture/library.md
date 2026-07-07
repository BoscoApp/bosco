# The Library (v0.3.0)

The Library is Bosco's flagship: a kid's encyclopedia where every topic is written at three reading
tiers. It has to satisfy three constraints at once — the locked **desktop metaphor** (destinations open
as windows, never a page navigation), the **offline invariant** (`adapter-static` strict: every route
prerendered, zero runtime network), and **offline search** (Pagefind indexes prerendered HTML, arriving
in a later PR). This note records how those reconcile so later PRs don't re-litigate it.

## One set of views, two hosts

The Library's views are plain, presentation-only components in `src/lib/library/` that know nothing
about routing or windows: `LibraryHome`, `CategoryView`, `ArticleView`, `TopicCard`, `TierSwitch`,
`StandaloneChrome`. They are mounted by two hosts:

- **Prerendered routes** (`src/routes/library/**`) — the canonical face. `/library/`,
  `/library/[category]/`, and `/library/[category]/[topic]/` each prerender to one static HTML file
  (dynamic routes enumerate their params via `entries()` from the gated `topics[]`). These are the
  deep-link target, the no-JS fallback, and — later — the Pagefind crawl target. They wrap the shared
  view in `StandaloneChrome` (a retro window on the liturgical wallpaper) with an "Open in Bosco" link.
- **The desktop window** (`src/lib/portal/windows/LibraryBody.svelte`) — the in-world face. It renders
  the same shared views, driven by a tiny `LibraryBrowser` `$state` store (`browser.svelte.ts`).

## In-window links never navigate

Inside the views, every internal link is a **real `<a href>`** to the canonical route — so deep links,
middle-click, ctrl/⌘-click, and no-JS all work. `LibraryBody` installs **one delegated, base-path-aware
click handler**: an unmodified left-click on a same-origin `/library/**` link is intercepted
(`preventDefault`) and turned into a `LibraryBrowser` store move; modified and middle clicks fall
through to the real URL. Because the desktop keeps every window mounted (`Window.svelte`,
`hidden={!open}`), a store move preserves window positions, z-order, and every other open window — a
`goto` would unmount the whole desktop. Focus moves to the new view's `<h1>` after each move.

## Tiers: the eager default is what makes prerender work

An `{#await loader()}` in a template renders its **pending** branch during SSR, so a topic page built
that way would ship empty HTML — fatal for offline/no-JS/search. Instead the content plugin emits a
second virtual module, **`virtual:bosco/content-eager`**, with a _static_ `import` of each **published**
topic's **default tier** (its `default_tier` frontmatter, clamped to the nearest declared tier, else
Explorer/2 to match `app.html`). `ArticleView` renders that pre-resolved component synchronously, so the
prerendered HTML carries exactly one tier of real prose.

Consequences that later PRs rely on:

- **One search record per topic, by construction** — only the default tier's prose is ever in the
  prerendered DOM, so Pagefind needs no `data-pagefind-ignore` choreography. The article body is wrapped
  in `data-pagefind-body`.
- **The gate holds** — the eager imports are emitted only for published topics, so a `pending` topic's
  bodies never enter the production bundle. (`import.meta.glob(..., { eager: true })` would breach this
  by bundling every tier of every topic — do not use it.)
- **`load()` stays serializable** — a route's `load()` returns only `{ category, slug }`; it must not
  return the mdsvex component (devalue can't serialize a component → prerender throws).
- The default tier is deliberately **omitted from the lazy `loaders`** (it's eager-only); the other two
  tiers load lazily on the client when the reader switches. In the window, `TierSwitch` sets a
  **per-article override**; the reader's global default lives in Settings (`data-tier` on `<html>`).

## What's next in v0.3.0

PR2 connective tissue (cross-links / See-also / Surprise-me / glossary, with a build-time dangling-link
validator); PR3 Pagefind offline search (`data-pagefind-body` is already placed); PR4 category-landing
and Archives-shelf visual design; PR5 the AI content-pipeline tooling. Content (the 3-topic proof and
the 18-topic launch set) is authored and doctrine-reviewed separately, at the owner's pace.
