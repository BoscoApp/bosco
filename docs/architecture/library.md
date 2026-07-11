# The Library (v0.3.0)

The Library is Bosco's flagship: a kid's encyclopedia where every topic is written at three reading
tiers. It has to satisfy three constraints at once — the locked **desktop metaphor** (destinations open
as windows, never a page navigation), the **offline invariant** (`adapter-static` strict: every route
prerendered, zero runtime network), and **offline search** (Pagefind indexes the prerendered
HTML at build time and runs entirely in the browser). This note records how those reconcile so later PRs
don't re-litigate it.

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

## Connective tissue: curated "See also" + "Surprise me" (PR2)

Two pieces of navigation, both built from the ordinary link machinery so they need no per-host branching:

- **See also** — a topic's `index.md` may carry a `related: [category/slug]` list (additive, optional).
  The content plugin validates it at build time (`validateCrossLinks`): every entry must resolve to a
  topic that ships in the _same_ build. Because that set is already gated, in production this enforces
  **approved → approved** — a "See also" link can never dangle or surface unreviewed content, and a
  bad path fails the build. The shared `SeeAlso.svelte` renders the resolved topics as the same
  `TopicCard` links used everywhere (so the in-window intercept and standalone routing both work) and
  takes the article's heading level + 1, so it nests correctly under the title in both hosts.
- **Surprise me** — a real `<a href>` to a random topic (`SurpriseButton.svelte`). The href is **seeded
  deterministically** (the first topic) so prerender and hydration agree — no `Math.random()` at build —
  then **re-rolled on the client** on `focus`/`pointerdown`, both of which fire _before_ the click's
  navigation reads the href. So keyboard (focus → Enter) and mouse (pointerdown → click) each land on a
  fresh pick with no hydration mismatch; a no-JS reader gets the seeded topic. It reuses the delegated
  in-window intercept exactly like any other link. Renders nothing when the catalogue is empty.

## Inline cross-links & glossary — the remark plugin (PR2b)

Two author-facing protocols resolve inside mdsvex at build time via a remark plugin
(`src/lib/content/remark-bosco.js`). Two facts shaped the design and are load-bearing:

- **The plugin chain must be Node-loadable `.js`.** `svelte.config.js` builds the mdsvex config and is
  loaded by SvelteKit with a raw Node `import()` that cannot transpile TypeScript — so `remark-bosco.js`
  and the gate primitives it imports (`gate.js`, `catalog.js`) are `.js` with JSDoc types, not `.ts`.
- **The gate crosses two module realms via `globalThis`.** The content plugin (`plugin.ts`) is bundled
  into the Vite config by esbuild; the remark plugin is loaded from disk by `svelte.config.js`. They are
  different module instances, so the shipping set can't ride a module variable — it lives on a
  `Symbol.for('bosco.content.catalog')` slot the plugin's `configResolved` populates before any Markdown
  is transformed, and `requireGate()` fails closed if it wasn't.

**Cross-links (`bosco:`, PR2b-i).** `[text](bosco:category/slug)` → the real `/library/…/` route, after
checking the target ships in this build; a dangling/unreviewed target (or any external prose URL) fails
the build. The walk validates every URL-bearing mdast node — `link`, `image`, and the `definition` node
a reference-style link hides its URL on — so nothing slips past.

**Glossary (`gloss:`, PR2b-ii).** `[term](gloss:id)` → a `<button class="gloss-term">` carrying the
term's definition in `data-gloss-def`, spliced (open tag · the link's original children · close tag)
around the preserved, possibly-formatted term text — the shape proven to round-trip through mdsvex.
Definitions live one file per term at `src/glossary/{general,faith}/<id>.md`: the body is the plain-text
definition, the frontmatter's **required** `review_status` is the term's own doctrine gate. `scanGlossary`
gates them exactly like topics (production = approved only), so a `gloss:` link to an unknown or
unreviewed term fails the build; `faith/**` is owned in CODEOWNERS. The definition is escaped twice into
the attribute — HTML-escape then brace-escape (`{`/`}` → numeric entities, so Svelte can't parse it as an
expression) — and read back at runtime with `textContent`, never `innerHTML`.

The term button is baked into the prerendered HTML, so it is **readable with no JavaScript**. A client
controller (`glossary-toggletip.ts`, bound in `ArticleView`'s `{#key}`-scoped `$effect`) upgrades it into
a _toggletip_: activating a term reveals its definition in a bubble and announces it once through a
shared, visually-hidden `role="status"` region, dismissed on Esc / trigger-blur / outside-click. The
interactive affordance is gated behind a JS-set `[data-gloss-ready]` marker, so no-JS degrades to prose.

## Offline search (Pagefind, PR3)

Search is static and offline: the build indexes the prerendered HTML, and all querying happens in the
browser over that index — no server, no runtime network.

- **The binary is vendored, not fetched.** `pagefind` is a devDependency whose platform binary ships as
  ordinary npm packages (`@pagefind/<platform>`, an `optionalDependencies` set with **no** install
  script), so `pnpm install --frozen-lockfile` resolves it from the lockfile with zero network at build
  time. The lockfile records every platform, so CI's Linux runner gets `@pagefind/linux-x64`. _This was
  the PR's gate — proven before any UI: install offline, then index offline._
- **Indexing is a build step folded into `build`** (`vite build && pnpm index:search`), so the guards and
  the offline smoke all see `build/pagefind/**`. `scripts/index-search.mjs` drives Pagefind's Node API,
  then does two things worth noting: it asserts `pagefind-entry.json` reports **≥ 1 record** (a zero-record
  index means the `data-pagefind-body` wrapper regressed — search would be silently empty), and it
  **prunes Pagefind's default UI** files (`pagefind-ui.*`, `-modular-ui.*`, `-component-ui.*`, the
  highlight helper). We ship our own UI, and one of those CSS files embeds bug-tracker URLs in a comment
  that would (correctly) trip `guard:external`; pruning keeps the offline invariant intact and trims the
  bundle. The kept core is `pagefind.js` + `pagefind-worker.js` + `wasm.*` + `*.pf_meta` + `fragment/` +
  `index/`.
- **One record per topic, for free.** Because only the default tier's prose sits in the prerendered DOM
  (see above) and only the article body carries `data-pagefind-body`, Pagefind indexes exactly the
  published topics — home/category/error pages are ignored, no `data-pagefind-ignore` choreography.
- **Our own tokenised UI.** `SearchPanel.svelte` (on `LibraryHome`, so it appears both standalone and
  in-window) loads the runtime with a runtime dynamic `import(/* @vite-ignore */ `${base}/pagefind/pagefind.js`)`
  — the bundle is emitted by the build, not part of Vite's graph, and is absent under `vite dev`, so the
  loader is browser-only and the panel degrades to "unavailable" if the load fails. `pagefind.ts` keeps a
  cached loader and a pure, unit-tested `toHit()` that re-applies `base` to Pagefind's root-relative URLs.
  Results are real `/library/**` `<a href>` links, so the desktop's delegated intercept opens them
  in-window while standalone/no-JS follow the route. Match excerpts render with `{@html}` (trusted:
  first-party indexed text, escaped by Pagefind, with only `<mark>` injected).

## Category landings & the Archives shelf (PR4)

Category landings already existed (PR1); PR4 enriches them and adds the per-topic Archives shelf, all
art-agnostic (illustration Decision #4 stays the owner's, on real proof assets that don't exist yet).

- **Archives shelf** — `ArchivesShelf.svelte`, a sibling of `SeeAlso` rendered at the foot of an article
  (broaden → deepen → cite). It lists a topic's `archives[]` (verbatim public-domain source writings) and
  is gated on the topic **offering the Scholar tier** (`topic.tiers.includes(3)`), NOT the reader's live
  level — a static, prerender-safe proxy for "deep enough to have grown-up sources", so the shelf (and,
  today, its empty teaser) is in the no-JS static HTML and needs no tier prop or hydration. Entries are
  **inert** (never `<a href>`): no viewer/route resolves an `archive.file` yet, and a dead link would 404
  and breach the offline invariant; the future viewer PR swaps the row wrapper to a link with no data
  change. The empty teaser sits behind a one-line `SHOW_EMPTY_TEASER` const. A pure `validateArchives`
  (no duplicate `file` within a topic), run in `scanPublished`, locks the seam (a no-op until archives are
  authored).
- **Illustration seam** — `ArtFrame.svelte` is an art-agnostic, `aria-hidden`, token-styled placeholder
  (a faint hatched "reserved" box — no `<img>`, no URL, no chosen aesthetic). Its one consumer is a slim
  category masthead in `CategoryView`. When illustrations arrive, a theme-aware `<Illustration>` resolving
  the active-theme `media[]` variant swaps in with the frame as its no-asset fallback.
- **Category enrichment** — `CategoryView`'s header gains the masthead frame, an article count, and a
  static "Written for Seedling · Explorer · Scholar" strip computed from the shelf's own topics (real DOM
  text, no `tier` prop, identical on the route and in-window). `data-view-heading` stays on the title so
  the desktop's focus-on-move still lands there.

## The content pipeline (PR5)

Authoring-time tooling under `scripts/content/` — manual and out-of-band like `scripts/calendar/`, run by
the owner, never imported by `src/**`, never run in CI (except a pure guard reader), zero new runtime deps.
It turns one **spec** (`scripts/content/specs/<category>/<slug>.topic.md`) into a `review_status: pending`
topic folder the plugin renders. Full runbook: [`scripts/content/README.md`](../../scripts/content/README.md).

- **Two kinds, one fork.** An adapted (story/fact) topic runs three passes — **A** (source → Tier 2),
  then **B** (→ Tier 1) and **C** (→ Tier 3) off the Tier-2 body. A verbatim (doctrine) topic runs none of
  them: its spec body is a label-only `## tier-N` / `## all` block (no adaptable free text), and the
  verbatim code path (`copyVerbatim`) takes **no generator** — so adapting doctrine is a code path that
  does not exist, not a rule checked at runtime. `runPipeline` forks once on `kind`.
- **The generator seam.** The passes call a `Generator` behind a seam. The default is a **deterministic
  offline fake** (placeholder prose, sentinel-marked) so the whole pipeline is unit-tested with zero
  network and no key. The real adapter (`generators/claude.mjs`, dependency-free global `fetch`) is
  dynamic-imported **only** under `--generator=claude`, so nothing else can reach the network — the runtime
  offline invariant is untouched.
- **Provenance & the doctrine guard.** Emit writes a per-topic `provenance.json` sidecar (source + whether
  each tier is verbatim or AI-adapted, with model/pass/date; verbatim tiers are SHA-256-frozen). `index.md`
  is written **last** so a crashed generation leaves an inert, index-less folder rather than a
  missing-tier build break. `pnpm guard:provenance` (in `ci`, reads source not `build/`) enforces the
  doctrine invariant: every `faith/**` topic must have a sidecar; registry-listed paths must be verbatim;
  a verbatim tier produced by a pass, a post-emit sha drift, or a fake-generated `approved` tier all fail.
  It proves _non-adaptation-by-the-passes_ + _untampered-since-emit_ — **not** doctrinal fidelity, which is
  the owner's human review. The build gate also greps the fake sentinel out of shipped output.
- **The review queue.** `pnpm content:review` is the owner's worklist — every topic the production gate
  excludes, doctrine badged, with the tier-file paths to open and read. Approving is the owner editing
  `review_status` to `approved`; the tool never does.

The three example specs / fixtures prove the machinery; **no content is emitted into `src/content` by this
PR** (the validators are proven by unit tests over temp dirs, like `validateCrossLinks`/`validateArchives`).

## What's next in v0.3.0

The content itself — the 3-topic proof and the 18-topic launch set — authored through this pipeline and
doctrine-reviewed at the owner's pace. That closes v0.3.0 Library.
