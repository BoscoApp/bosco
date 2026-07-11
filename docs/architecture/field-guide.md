# The Field Guide (v0.4.0)

The Field Guide is the first destination layered on top of the Library rather than beside it. It adds no
new content silo: it is a **second way into the creatures the Library already holds** — browse them by
habitat and by kind, meet each one's anatomy diagram and range map, and keep a quiet per-child **album**
of the creatures you've read about. Its "done when" (roadmap): _habitat/kind index over approved
creatures; the profile-scoped card album (records, no incentives); ≥1 hotspot diagram + range map
(placeholder art), keyboard-accessible; offline._

This note is the vetted blueprint (a multi-agent design workshop: three proposals → three judges →
synthesis → five adversarial critics → reconciliation; 24 findings folded in). It exists so later PRs
don't re-litigate the decisions below.

## The rendering decision: SVG/DOM, not PixiJS (ratified 2026-07-11)

The roadmap _nominated_ PixiJS for the anatomy diagrams. The workshop's three judges were unanimous, and
the owner **ratified declining PixiJS for v0.4.0**: the diagram and the range map are built as **SVG/DOM**.

Every hard invariant points the same way, and none points at WebGL:

- **Prerender + no-JS.** `adapter-static` prerenders every route (`strict: true` fails the build on a
  non-prerenderable one) and `guard:offline` is a headless no-JS smoke. A client-only WebGL canvas
  (`onMount` under `{#if browser}`) renders **nothing** at prerender and **nothing** with JS off — a
  `guard:offline` hole by construction.
- **Accessibility.** A `<canvas>` is invisible to axe and to screen readers, so the a11y floor forces a
  **real focusable DOM shadow behind the canvas anyway.** With Pixi you build the SVG/DOM version
  underneath the canvas and keep two representations in sync — double the work, zero gain.
- **Dependency surface.** The only runtime dependency today is `zod`, and CI is `--frozen-lockfile`.
  Pixi adds ~400 KB plus an asset-loader `fetch`/`new Worker()` surface straight into `guard:external`.
- **The artifacts are vector, not raster.** Labelled anatomy regions and a highlighted range zone with a
  caption are DOM-native. The plan reserved Pixi for the Art Studio's genuine raster needs (flood-fill,
  PNG export) and said "plain 2D/DOM for the games." Choosing SVG/DOM **honors the plan's own boundary.**

Revisit Pixi only on a true raster/deep-canvas trigger — deep-zoom on a large anatomical plate; animated
multi-step reveals; hundreds of hotspots on one plate; or a single engine genuinely shared across Field
Guide + Art Studio + Arcade. None are in v0.4.0.

## No content silo: the index derives from Library frontmatter

The two indices (by habitat, by kind) are built at build time from the gated
`topicsByCategory('creatures')` — the same resolved `Topic[]` the Library shelves read. There is no
separate Field-Guide content store. A creature is a Library topic under `src/content/creatures/`; the
Field Guide only adds two frontmatter fields and a handful of views.

### Schema: `habitat` + `kind`, creature-only, via `.superRefine`

`topicFrontmatterSchema` is built on a single flat `z.object` (not a discriminated union), and the
content plugin spreads the whole parsed `meta` into `virtual:bosco/content`. So the two new fields are
added as **optional** members and the creature-only rules are enforced with a **`.superRefine`** wrapping
that object — never a discriminated union, which would change inference and break the plugin's flat spread.

- `habitat: z.array(z.enum(HABITATS)).min(1)` — **multi-valued** (a red fox is woodland _and_ farmland).
- `kind: z.enum(KINDS)` — single-valued. (Named **`kind`**, not the roadmap's "type": it matches the
  shipped desktop copy "Browse by habitat or by kind," reads better for kids, and avoids the JS reserved
  word. Owner-ratified 2026-07-11: _roadmap "type" == build "kind"._)

`.superRefine` rule: `category === 'creatures'` ⇒ both **required**; `category !== 'creatures'` ⇒ both
**forbidden** (error if present). This is fail-closed parity with the rest of the schema. Because the
plugin spreads the whole `meta`, the fields flow into `TopicMeta`/`Topic` with **zero plugin changes**,
and `isPublished` stays category-blind — habitat/kind never touch the gate.

Enums are **closed** (a typo fails at `z.enum` parse; no empty axis page can ever be minted). Membership
is a content call; the _mechanism_ (closed enums) is the decision. Working sets:

- `HABITATS ≈ [woodland, grassland, wetland, ocean, river, desert, mountain, polar, sky, farmland, garden]`
- `KINDS ≈ [mammal, bird, fish, reptile, amphibian, insect, arachnid, mollusk, bestiary]` — where
  `bestiary` = symbolic/heraldic creatures (e.g. `basilisk-draft`, gated out of production today).

`content/creatures/red-fox/index.md` is backfilled with `habitat: [woodland, farmland]`, `kind: mammal`
in the same PR (it is the only published creature, so a required-field rule cannot gate-fail it).

The **`anatomy` and `range` sub-schemas are NOT added here** — they land in their consumer PRs (FG-6,
FG-7) alongside the artifact each one validates, so no schema field points at an asset that doesn't
exist yet.

## Index, routes, and the desktop window

Routes-first and prerendered, mirroring the proven Library pattern (`entries()` over the gated set;
`load()` returns serializable identity only; the page re-resolves via a by-axis helper):

- `/field-guide/` — the hub. Renders **both** groupings inline (by-habitat sections, then by-kind
  sections) so a **no-JS reader gets the complete index on one page.**
- `/field-guide/habitat/[habitat]/` and `/field-guide/kind/[kind]/` — thin axis pages, a filtered
  creature grid.
- `entries()` derives from the habitat/kind values **actually present in the gated creature set** —
  never the raw enum. No empty axis page ships; a value present only on a pending creature never
  prerenders; `strict: true` never 404s; the gate cannot leak.
- Every creature row is a real `<a href>` to the creature's **existing** article,
  `${base}/library/creatures/<slug>/` (trailing slash required). No article content is duplicated.
- Hub and axis pages carry **`data-pagefind-ignore`** so browsing chrome doesn't dilute offline search.

Axis pages are a **new, tiny `AxisView`** component, not a `CategoryView` reuse: `CategoryView` is
category-bound end to end (`topicsByCategory(category)`, category-keyed labels/accents/`ArtFrame`, and it
literally renders `{topics.length} articles`). `AxisView` filters `topicsByCategory('creatures')` by the
axis value and composes the genuinely reusable units — `TopicCard` + the `.cat-grid` CSS.

**The index must not read album state.** No "✓ in your album" badge, no greyed "unread" treatment —
that manufactures collect-'em-all pressure while passing every structural gate. Enforced by a test that
the field-guide index routes/components import nothing from `$lib/state` or `album.ts`. The index is
browsing, not a checklist.

### Activating the window (no router)

The Field Guide destination already exists as a `kind: 'soon'` placeholder (dock icon, window, Home
door). Activate it exactly as the Library was promoted: in the `Desktop.svelte` `{#if}` ladder, add
`{:else if def.id === 'win-fieldguide'} <FieldGuideBody/>` **before** the `ROOMS[def.id]` check; delete
`win-fieldguide` from `ROOMS`; flip its `WINDOWS` entry to `small: false`.

`FieldGuideBody` owns its **own private** `FieldGuideBrowser` store (`guide.svelte.ts`, a
discriminated-union location: `{index} | {axis, value} | {article: {category, slug}} | {album}`).

### The anchor-intercept becomes a shared helper

`LibraryBody`'s click-intercept carries non-trivial shared logic (origin check, modifier/middle-click
bail, base-prefix claim, focus-the-heading-after-tick) with only the path-parse step differing.
Copy-pasting it into a second window is the fork-when-you-should-reuse trap. Extract
`$lib/portal/anchorIntercept.ts` taking a per-window `(pathname) => boolean` parse/navigate callback;
both `LibraryBody` and `FieldGuideBody` consume it. **LibraryBody's refactor onto it rides in FG-3a.**

The Field Guide intercept claims the **full `${base}/library/` prefix**, not just
`/library/creatures/`: an inline creature article renders `bosco:`/`related`/`SeeAlso` cross-links to
_any_ category, and letting a `/library/faith/…` link fall through would tear down the whole desktop.
Claiming full `/library/` renders any Library topic inline via the shared `ArticleView` — identical to
the Library window's behavior. Modified/middle clicks and no-JS fall through to the real prerendered
pages.

**Every view transition moves focus.** `LibraryBody` focuses a heading only inside anchor-driven moves;
the album and index are reached by non-anchor controls the intercept never sees, which would strand
focus on a detached trigger. Every `FieldGuideBrowser` transition (including album and back-to-index)
routes through an explicit focus move to a `[data-view-heading]` element (`tabindex=-1`) on the
destination.

Reused unchanged: `TopicCard`, `ArticleView` (with its `TierSwitch`/`SeeAlso`/`ArchivesShelf`),
`ArtFrame`, `StandaloneChrome`, `categories.ts` (creatures accent `var(--green)`).

## The album: records, not rewards

The album is a per-child record of creatures read — **earned on read, never on collect.** It is a
profile-scoped IndexedDB collection (`album`) reached only through the `$lib/state` boundary. Everything
about it is built to make gamification structurally awkward.

### Record-on-read: a host-mounted component, snapshot-pinned

`ArticleView` imports zero state today, and it must stay that way — if it self-mounted the recorder
(which imports `album.ts` → state), every shipped-and-closed Library consumer would transitively pull
album/IndexedDB into its bundle. Instead a one-line `<RecordOnRead {topic}/>` is mounted at the **three
in-repo hosts**: the standalone `/library/[category]/[topic]/+page.svelte`, `LibraryBody`, and
`FieldGuideBody`. An import test asserts all three mount it and that `ArticleView` imports no state.

`RecordOnRead` fires **once per mount** via `onMount` (browser-only) and:

- **Snapshots the active-profile id at fire time; `activeProfile` is explicitly not a reactive
  dependency.** In Svelte 5 a reactive `$effect` re-runs when its deps change; because the desktop keeps
  every window mounted and only toggles visibility, a parent switching profiles while an article stays
  mounted would otherwise re-fire the record against the _newly_ active profile — a cross-profile
  false-write. `onMount` runs exactly once and the snapshot pins the write to the profile that was
  active when the article opened.
- Fires only when `browser`, `topic.category === 'creatures'`, and an active profile exists (best-effort
  — it swallows the no-profile case so reading never blocks).

Semantics: **tier-neutral** (opening at any tier records; switching tiers neither re-records nor
un-records); **the index does not record** (recording = article mount only); **no-JS readers record
nothing and lose no content** (the album is a convenience record, never a content gate).

### `recordOnce`: the one real correctness gap

`store.addRecord` unconditionally stamps a fresh `updatedAt` and `put()` overwrites by key — so calling
it per mount re-bumps `updatedAt`, re-marking the card pending on every re-read (violating
append-only/monotonic and the anti-nag rule). The album adds an insert-if-absent primitive on
`BoscoStore`:

```ts
async recordOnce<T>(collection, id, data): Promise<SyncRecord<T>> {
  const key = this.collectionKey(collection);                     // throws if no active profile
  const existing = (await this.records.getAll(key)).find(r => r.id === id);
  if (existing && !existing.deleted) return existing as SyncRecord<T>;  // live hit: no put(), no bump
  const record = { id, updatedAt: this.now(), data };             // absent OR tombstoned → fresh record
  await this.records.put(key, record);
  return record;
}
```

- **Tombstone-aware.** A synced-in `deleted: true` tombstone (which `mergeRecords` keeps by id) must not
  permanently block re-recording — hence the `!existing.deleted` guard, with a unit test for the
  tombstoned-id path (this primitive is reused later by mastery, high-scores, saved art).
- **TOCTOU caveat (accepted, documented).** Two concurrent fires for the same slug both pass the
  "absent" check; both `put()` collapse to one record by id (count-idempotent), but the surviving
  `updatedAt` is the later read's. Harmless for ordering; the "set once" framing is a microsecond-loose.
- Lives in the store (single persistence boundary, needs `collectionKey` scoping). `getAll`-then-`find`
  is O(n) but the album is bounded (~18); no `RecordBackend` change.

A thin `src/lib/state/album.ts` centralizes the record shape and the profile guard, with
**records-not-rewards vocabulary** (`recordCard` / `hasCard` / `listCards` — never `earn`/`claim`, so
reward verbs can't leak into UI copy). All three **guard the profileless case by returning, never
throwing** (`collectionKey` throws with no active profile, and the album _view_ must call `listCards()`
to render its "make a profile" state).

### Record shape: a pure pointer

`SyncRecord.id = <slug>`; `data = { v: 1 }` — a schema-version tag and **nothing else.** No title, no
tier, no count, no rarity, no first-seen timestamp. **All display data (title, art, summary) is joined
from live gated frontmatter at view time**, so a card whose creature is later un-approved resolves to an
inert placeholder frame that **never leaks the formerly-approved title.** Slug-as-`id` gives natural
dedupe and lossless sync union-merge. The `album` collection rides free through
`pendingChanges`/`sync`/`export`/`import`/`deleteProfile` (all enumerate collections dynamically); no
migration and no `SCHEMA_VERSION` bump (no new pref).

### The album view: a JS-only convenience surface

The album's data is inherently profile-scoped client-only IndexedDB, and recording is itself JS-only —
so a prerendered no-JS album shell could never show a reader their cards; a route would be pretense. The
album is therefore an **articulated JS-only convenience** (parallel to record-on-read), not a content
surface. The `/field-guide/` hub remains the complete no-JS index. There is **no `/field-guide/album/`
route.**

The view is a calm profile-scoped grid of `ArtFrame` placeholders, **recorded cards only** — never
ghost/locked slots. Each card shows title + summary (joined from live gated frontmatter) and links to
the article. Switching profiles swaps albums; no cross-profile comparison. Ordering is **alphabetical
(or taxonomic by kind)** — first-seen ordering is dropped (it renders reading chronology as spatial
order, cadence-by-value). `updatedAt` is used only for sync merge, never for display.

Pinned copy (so the merge gate reviews a diff, not a vibe):

- Empty state: **"Creatures you've read about show up here."**
- No-profile state: **"Make a profile to start your own album."**

### Anti-incentive checklist (records, NOT rewards)

1. **No rarity** — every card equal; `kind` is taxonomy, never a common/rare ranking.
2. **No streaks / consecutive-day counters** — `updatedAt` is never rendered.
3. **No completion pressure** — no "12 of 18," no percent bar, no per-habitat "3/5," no locked-slot
   silhouettes.
4. **No score** — no points/XP/levels.
5. **No nags** — no "come back," no notifications, no badges, no empty-slot teasers.
6. **No record-moment feedback — silent.** No chime, confetti, or toast. The card simply _is_ there next
   time. (This also structurally dissolves any double-fire "two toasts" concern.)
7. **No leaderboards / cross-profile compare / social / sharing.**
8. **No time-tracking; no dates rendered as cadence.** Ordering alphabetical/taxonomic, never "by value."

**Count and completion are not structurally impossible — they get an automated gate.** The view has
`listCards()` and the build has the denominator `topicsByCategory('creatures').length`, so "you've
collected 5" or "12 of 18" is one line of view code away and passes every existing gate. A DOM/unit test
asserts the album and index components render **no numeric collection count and no `<progress>`/percent
element**, plus a grep-style assertion over built `/field-guide` output — converting checklist items 3
and 4 from a manual review into concrete gates.

## The anatomy hotspot diagram (SVG/DOM)

The teaching content is the hotspot **blurbs**, so unlike a glossary gloss (which annotates prose that
stays readable), the blurbs must be baked into readable DOM **unconditionally** — a no-JS or print reader
who got bare labels (`Ears`, `Tail`) would silently lose the anatomy facts.

`HotspotDiagram.svelte`:

- An `ArtFrame kind="diagram"` (`aria-hidden` decorative backdrop) under a `<figure>`.
- A real, complete `<dl>`/`<ul>` of `{label + blurb}`, present with **no JS** — the content lives here.
- Focusable `<button>` hotspots absolutely positioned by the schema's **percentage** coords
  (resolution-independent; survives the art swap). Each button's accessible name is its `label`
  (schema-required, build-fails if empty); its description references the already-present blurb via
  **`aria-describedby`** (pointing at the baked DOM), not a JS-only reveal.
- The toggletip is **pure enhancement** over that DOM (the `data-gloss`
  bake-accessible-DOM-then-enhance precedent). Reduced-motion drops the transition, keeps the highlight.
- Rendered in `ArticleView` when `anatomy` is present; one reference diagram on red-fox (placeholder base
  art via a `media[]` id). Instantiates no canvas — runs at prerender, no `{#if browser}` gate.

Schema (added in FG-6): `anatomy?: { diagram: <media-id>, hotspots: [{ id, label, x, y, blurb, tier? }] }`
with `x`/`y` as 0–100 percentages. `validateFieldGuide(topics)` runs over the gated shipping set at the
`scanPublished` site (the `validateCrossLinks`/`validateArchives` precedent): each `anatomy.diagram`
resolves to a `media[]` entry, each hotspot has a non-empty `label` and in-range coords — dangling ⇒
**build fails.**

## The habitat range map (SVG/DOM)

`RangeMap.svelte`: a **bundled** base map at `static/maps/base.svg`, referenced root-relative
`/maps/base.svg` (`media[] kind: 'map'`, already valid). The base carries a fixed set of named-region
`<path id="…">`s. The per-creature overlay is a same-origin inline-SVG highlight of the creature's listed
`regions`, plus a **static, non-focusable** text list of region names (there is no `/field-guide/region/…`
route, so focusable list items would be no-op tab stops; a screen reader reads a static `<ul>` fine). The
`caption` ("Found across North America and Europe") is the no-JS truth and kills any colour-only signal;
the tint is enhancement. Zero external tiles. One reference range on red-fox. Base-map provenance is
logged in `CREDITS.md`.

Schema (added in FG-7): `range?: { base: <media-id>, regions: string[], caption: string }`.
`validateFieldGuide` (extended in FG-7) **parses the committed `static/maps/base.svg` at build** and
validates `range.regions[]` against its real `<path id>` set — not a hand-maintained mirror, which would
fail open when a `<path id>` is renamed. Dangling region ⇒ **build fails.**

## The illustration seam + the SVG-cleanliness invariant

One swap-point per asset class so Decision #4 (illustration aesthetic, still deferred to the owner) is a
later **batch replace**; all three are `aria-hidden` decorative with the real interactive/data DOM on
top, so accessibility and no-JS never depend on the art:

1. **Card art** (index cards, album cards, `TopicCard`) — `ArtFrame kind="illustration"`.
2. **Anatomy base plate** — `ArtFrame kind="diagram"` backdrop under the real hotspot layer.
3. **Range base map** — the bundled functional `/maps/base.svg` now; illustrated per-theme replacement
   later via `media[]` variants.

**Committed SVGs must be SVGO-cleaned of all editor/RDF namespaces — this is the default, not an edge
case.** `check-external-urls.mjs` walks the whole `build/` (including the verbatim-copied `static/`),
matches any absolute `http(s)://` in `.svg`/`.html` markup, and allowlists `www.w3.org` **only.**
Hand-authored / Inkscape / Illustrator SVGs routinely embed `xmlns:sodipodi`, `xmlns:inkscape`,
`xmlns:cc="http://creativecommons.org/ns#"`, and `dc:`/`cc:` license URLs — every one a `guard:external`
violation, and the Pagefind prune step runs after build over `build/` and covers no `static/` asset. So
`static/maps/base.svg` and any committed diagram SVG are **SVGO-cleaned before commit**, enforced by a
**checked-in assertion** that greps committed SVG source for disallowed namespace/URL patterns and fails
before build. Do **not** widen the w3.org allowlist.

## PR slicing (ordered; each ships green)

- **FG-1 · Creature schema (`habitat`/`kind` only).** Add the two closed enums, `.superRefine`
  (creatures-only + required-for-creatures), backfill red-fox; grep that no stray `type` axis identifier
  survives. No `anatomy`/`range`, no `validateFieldGuide`, no UI. _Proves green:_ `check` + `test:unit`
  (creature requires both; non-creature forbids both; red-fox parses; basilisk-draft still gated);
  `guard:content` unaffected; build passes.
- **FG-2 · `recordOnce` + `album.ts`.** Insert-if-absent store primitive (tombstone-aware) +
  `recordCard`/`hasCard`/`listCards` (profileless-safe) + `{v:1}` record shape. Pure state, no wiring.
  _Proves green:_ `test:unit` via `makeStore()` — double-record leaves `updatedAt` frozen and does not
  re-list in `pendingChanges`; tombstoned-id re-inserts; profileless returns `[]`/`false`; collection
  rides free through export/import/sync.
- **FG-3a · Hub + window activation + shared intercept.** Extract `anchorIntercept.ts`; refactor
  `LibraryBody` onto it. Activate `win-fieldguide`; route `/field-guide/` (both groupings inline);
  `FieldGuideBody` + `FieldGuideBrowser`; every transition moves focus; `data-pagefind-ignore`. **Append
  `/field-guide/` + real tokens to `check-offline.mjs`** and a **FG-unique token to `guard:content`
  `MUST_BE_PRESENT`** (`'The Red Fox'` is already satisfied by Library). _Proves green:_ build;
  non-vacuous `guard:offline` + `guard:content` + `guard:external`; e2e nav (local).
- **FG-3b · Axis routes.** New `AxisView`; routes `/field-guide/habitat/[habitat]/` +
  `/field-guide/kind/[kind]/` with `entries()` from **gated-present values only**;
  `data-pagefind-ignore`; append an axis route + token to `check-offline.mjs`. _Proves green:_ build (all
  axis paths have `entries()`); `guard:offline` + `guard:content`; e2e (local).
- **FG-4 · Record-on-read wiring.** `RecordOnRead` (browser-only, creatures-only,
  profile-snapshotted-at-mount, silent, idempotent) at the three hosts; `ArticleView` stays state-free;
  import test proves all three mount it. _Proves green:_ `test:unit` (guards + snapshot); e2e — open
  red-fox → 1 card; reopen → still 1, `updatedAt` frozen; profile-switch-without-navigate writes
  nothing; faith topic → 0 cards; profileless → no throw.
- **FG-5 · Album view (JS-only convenience).** Profile-scoped recorded-only grid, `ArtFrame`
  placeholders, ids joined to live gated frontmatter (un-approved → inert frame, no title leak), pinned
  copy, alphabetical order, `[data-view-heading]` + managed focus, anti-incentive gate. No prerendered
  album route. _Proves green:_ e2e axe (local); the no-count/no-percent gate; index-imports-no-state
  test; gate test (un-approve → inert frame); pinned-copy diff.
- **FG-6 · Anatomy hotspot diagram (SVG/DOM).** Add `anatomy` sub-schema + `validateFieldGuide` at
  `scanPublished`. `HotspotDiagram.svelte` (baked `<dl>` no-JS-complete + `<button>` hotspots with
  `aria-describedby`; toggletip enhancement; reduced-motion). One reference diagram (red-fox); SVGO-clean
  the committed SVG; add a red-fox blurb phrase to `check-offline.mjs`. _Proves green:_ `guard:external`
  - `guard:offline` (blurb token) + SVG-cleanliness assertion; e2e axe; build fails on dangling hotspot.
- **FG-7 · Habitat range map (SVG/DOM).** Add `range` sub-schema + `validateFieldGuide` extension that
  **parses committed `static/maps/base.svg`** and validates `regions[]` against its real `<path id>`
  set. Bundled `/maps/base.svg` (CREDITS.md, SVGO-clean). `RangeMap.svelte` (highlight + static region
  text list + caption). One reference (red-fox); add the caption token to `check-offline.mjs`. _Proves
  green:_ `guard:external` + `guard:offline` (caption token) + SVG-cleanliness assertion; e2e axe; build
  fails on dangling region.

Dependencies: FG-1 → FG-3a → FG-3b (index chain); FG-2 independent; FG-4 needs FG-2 + FG-3a; FG-5 needs
FG-3a (+FG-2); FG-6 needs FG-1; FG-7 needs FG-1. FG-6 + FG-7 may merge into one "SVG/DOM art-swap" PR
(same review family), kept separate here so each ships one reference artifact under a tighter review.

## Hard "no" list (scope fences)

No per-creature `/field-guide/[creature]` route (the canonical article already lives under `/library/`);
no `/field-guide/album/` prerendered route (album is JS-only); no `/field-guide/region/…` route (region
names are static text); no pan/zoom/animated diagrams (the Pixi temptation); no
rarity/streak/count/completion/score/gamification; named regions only; exactly one reference diagram +
one reference map; real illustration aesthetic deferred to the owner; PixiJS explicitly **out** of the
Field Guide, revisitable only on the stated raster/deep-canvas triggers.

## Owner-facing decisions

1. **PixiJS declined** for the Field Guide's diagram + map (Option S adopted) — _ratified 2026-07-11_.
   Revisit only on a stated raster/deep-canvas trigger.
2. **`type` (roadmap) == `kind` (build)** — _ratified 2026-07-11_; `kind` matches shipped copy.
3. **Illustration aesthetic** (card art, anatomy base plate, range base map) remains **deferred**; the
   build is art-agnostic with one swap-point per asset class.
4. **HABITATS / KINDS enum membership** and the **base-map region set** are content calls; the blueprint
   fixes only the mechanism (closed enums; regions validated against the parsed `base.svg`).
5. **Album is JS-only** (no no-JS keepsake shell) — an accepted, articulated convenience-surface
   boundary, consistent with record-on-read being JS-only.
