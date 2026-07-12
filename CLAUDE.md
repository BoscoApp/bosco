# Bosco (bosco.kids)

> Handoff brief for a fresh environment (Coder cloud dev container) and a new Claude Code session.
> Everything below was verified against the actual repo at commit `d5cb339` on `develop`. This file is
> committed and travels with the repo; the maintainer's global `~/.claude` config and the auto-memory
> from the previous machine do **not** travel, so the durable rules are folded in here.

## Snapshot (at a glance)

- **Runtime:** Node.js **≥ 20** (`package.json` `engines`); CI runs on **Node 22** — match that. No `.nvmrc`.
- **Package manager:** **pnpm 9.15.9** (pinned via `packageManager`; use `corepack enable pnpm`). Lockfile: `pnpm-lock.yaml`.
- **Backing services:** **NONE.** No database, no Redis, no server. All user data is client-side (browser `localStorage` + `IndexedDB`). Zero external network at runtime is a hard invariant.
- **Install (fresh clone → ready):** `corepack enable pnpm && pnpm install` (CI uses `--frozen-lockfile`). For e2e also: `pnpm exec playwright install --with-deps chromium`.
- **Run (dev):** `pnpm dev` → Vite dev server on **port 5173**.
- **Build:** `pnpm build` (= `vite build && pnpm index:search`) → static site in `build/` + Pagefind index in `build/pagefind/`.
- **Test:** `pnpm test:unit` (Vitest) · `pnpm test:e2e` (Playwright — builds, then serves `build/` on **port 4173**, Chromium; local-only, not in the CI gate).
- **Lint/Static:** `pnpm check` (svelte-check: types + a11y) · `pnpm lint` (`prettier --check` + eslint) · plus the guards (`guard:external|content|colour|svg|offline|provenance`).
- **Default branch:** `develop`. `main` is protected, release-only.
- **Only runtime dependency:** `zod`. Everything else is build/dev tooling. There is **no server process** — the deliverable is static files served by any static host (nginx in the eventual Docker image).

## Overview

Bosco is **a tiny, fully-offline 1990s-style "internet" for traditional Catholic kids (ages 4–16)** — a retro *Portal* (desktop) a child explores: a Library (a kid's tiered encyclopedia), a Field Guide (creatures by habitat/kind, with a card album and anatomy diagrams), and later a Chapel, Art Studio, Arcade, and Typing Trainer. One codebase is designed to ship three ways: a static public site, an installable PWA, and a self-hostable offline Docker image (the container is built at v1.0.0).

**Maturity:** pre-1.0, **not yet publicly released.** Tagged releases: `v0.1.0` (Core) and `v0.2.0` (Interface). Since then the **v0.3.0 Library engine** (all PRs) and **v0.4.0 Field Guide engine** (6 of 7 PRs) have merged to `develop` but are **not yet tagged** (release-please cuts the next tag when its release PR merges). `package.json` version is `0.2.0`. Production: none yet.

**The honest risk is content, not code** — authoring + doctrinally reviewing topics at three reading tiers is the real work; the maintainer is the doctrinal reviewer. See [`ROADMAP.md`](ROADMAP.md) for the full version-per-pillar plan and [`README.md`](README.md) for the invariants.

## Architecture

**Framework:** SvelteKit 2 (`@sveltejs/kit ^2.15`) on **Svelte 5** (`^5.16`, runes: `$state`/`$derived`/`$props`/`$effect`) with **`adapter-static ^3` in `strict` mode** (every route prerenders or the build fails; a client-rendered `404.html` fallback for unknown paths). Build tool **Vite 6**. Content is **mdsvex `^0.12`** Markdown. Validation **Zod `^3.24`** (the sole `dependencies` entry). Offline search **Pagefind `^1.5`**. Tests **Vitest 3** + **Playwright `^1.61`** (+ `@axe-core/playwright`). **TypeScript 5.7**, ESLint 9, Prettier 3.

> PixiJS and a `sharp` media pipeline are named in the roadmap (Art Studio, later media) but are **not yet dependencies** — do not add them speculatively. PixiJS is explicitly **declined** for the Field Guide (SVG/DOM is used there).

Key directories (`src/`):

- **`lib/content/`** — the content engine. Zod schema (`schema.ts`), the Vite plugin (`plugin.ts` → `boscoContent()`) that scans `src/content/**`, applies the doctrine gate, and emits the virtual modules `virtual:bosco/content` + `virtual:bosco/content-eager` (static default-tier imports so prose prerenders). The **doctrine gate** (`gate.js`) and the remark chain for inline `bosco:`/`gloss:` links (`remark-bosco.js`, `catalog.js`) are plain **`.js`** because `svelte.config.js` loads them via raw Node (no TS transpile) and they cross module realms via a `globalThis` catalog.
- **`lib/library/`** — the reading UI (host-agnostic, used by both prerendered routes and the desktop windows): `ArticleView`, `CategoryView`, `TierSwitch`, `SeeAlso`, `ArchivesShelf`, `ArtFrame` (art-swap placeholder seam), `TopicCard`, `SearchPanel`, `glossary-toggletip.ts`, and the new **`HotspotDiagram.svelte` + `hotspot-diagram.ts`** (FG-6 anatomy diagram), plus the in-window `LibraryBrowser`.
- **`lib/fieldguide/`** — Field Guide surfaces: `FieldGuideHome`, `AxisView`, `AlbumView`, `RecordOnRead`, `guide.svelte.ts` (`FieldGuideBrowser`), `axes.ts`, `album-cards.ts`. Layers on Library frontmatter — no separate content silo.
- **`lib/portal/`** — the retro desktop shell: window manager, dock, menu bar, `Desktop.svelte`, `anchorIntercept.ts` (in-window link interception, no navigation), profiles/avatar, calendar-driven wallpaper.
- **`lib/state/`** — the local-first data layer. **Everything touching storage imports `$lib/state` only.** `BoscoStore`, IndexedDB backend, `album.ts`, and a `SyncAdapter` seam (default `NoopSyncAdapter`) so opt-in sync bolts on later (v1.1.0) without touching features.
- **`lib/styles/`** — CSS design tokens (`tokens.css`, `fonts.css`); three orthogonal `<html>` axes: `data-theme` / `data-lit` (liturgical colour) / `data-tier` (reading level).
- **`lib/calendar/`** — the vendored 1962 liturgical calendar as **committed** `calendar.json` (+ `schema.ts`). Regenerated out-of-band (see Dev Environment) — never at app-build time.
- **`content/`** — topics, folder-per-topic: `<category>/<slug>/index.md` (frontmatter) + `tier-1/2/3.md` bodies. Categories: `creatures`, `faith`, `world`. `src/glossary/{general,faith}/<id>.md` holds glossary definitions.
- **`routes/`** — prerendered routes: `/`, `/library/**`, `/field-guide/**`.

Other: **`scripts/`** = the guards (`check-*.mjs`), `index-search.mjs`, `serve-static.mjs`, `calendar/` (vendoring), `content/` (the offline AI authoring pipeline — manual, never run by CI). **`docs/architecture/`** = the durable design docs (`offline-invariant.md`, `library.md`, `field-guide.md`, `state-and-sync.md`, `static-output-contract.md`) — read these before large changes.

**Long-lived branches:** `develop` (integration) and `main` (protected, release-only). No other long-lived branches.

## Dev Environment  (BE PRECISE — a container is built from this)

**Runtime:** Node **22** (CI-matched; the floor is ≥ 20). pnpm **9.15.9** via Corepack. That is the entire required toolchain for install/build/test.

**Install:**
```sh
corepack enable pnpm
pnpm install                 # CI: pnpm install --frozen-lockfile
```
`.npmrc` sets `strict-peer-dependencies=false` and `auto-install-peers=true`. **Network at install time is fine and required** (npm registry, including Pagefind's platform binary `@pagefind/linux-x64` on the container — it is a vendored package, *no* postinstall download). The zero-network invariant is a **runtime** rule, not an install rule.

**Run / build / serve:**
```sh
pnpm dev                     # Vite dev server → http://localhost:5173
pnpm build                   # → build/  (vite build && pnpm index:search → build/pagefind/)
pnpm preview                 # Vite preview of the build
pnpm serve:static [port] [dir]   # static server over build/ (default port 4173, dir build/) — stands in for nginx
```

**Test / static analysis:**
```sh
pnpm check                   # svelte-check (types + a11y)
pnpm lint                    # prettier --check . && eslint .
pnpm test:unit               # vitest (unit; includes scripts/** guard + content-pipeline tests)
pnpm test:e2e                # playwright — auto-runs `pnpm build && pnpm serve:static 4173`, Chromium
pnpm guard:external          # fail on any external URL in build/  (the offline invariant)
pnpm guard:content           # no unreviewed (pending) content in a production build
pnpm guard:colour            # every component colour is a token, not a literal
pnpm guard:svg               # committed SVGs are SVGO-clean (no editor/RDF/license cruft)
pnpm guard:offline           # built output serves every route with no backend (docker-run-none proof)
pnpm guard:provenance        # doctrine byte-copied, never AI-adapted; faith/** carries provenance.json
```

**The required CI gate** (`.github/workflows/ci.yml`, one status named `ci`, runs on Node 22): PR-title lint → `pnpm check` → `pnpm lint` → `guard:colour` → `guard:svg` → `pnpm build` → `guard:external` → `guard:content` → `guard:provenance` → `guard:offline` → `pnpm test:unit`. **Playwright e2e is intentionally NOT in the CI gate** (it needs a browser); it is the local/pre-release browser-runtime proof. To run it in the container, install Chromium first: `pnpm exec playwright install --with-deps chromium`.

**Ports:** dev **5173**; static-serve & e2e **4173** (`serve:static` also honours `$PORT`). No other ports.

**Backing services:** none. **Env vars / secrets:** none required — there is no `.env.example`, and `.env*` is gitignored. The app reads no server config. (Two *optional* build-time env flags exist for content review: `CONTENT_PREVIEW=1` includes not-yet-approved topics in a build, and `VITEST` toggles preview mode in tests — neither is needed for a normal dev/build.)

**One-time setup / DB / migrations:** none. No database, no seeders. The vendored `src/lib/calendar/calendar.json` is committed, so nothing generates it at build.

**Out-of-band only (NOT needed to build or run):** regenerating the liturgical calendar. `scripts/calendar/vendor-calendar.mjs` + `dump-contracts.php` produce `calendar.json` from the sibling **introibo** project (AGPL engine, CC0 data; the previous machine had it at `../introibo.org`). That step needs **PHP** and the sibling repo and is run manually and rarely. The container does **not** need PHP for anything in the normal loop.

## Current State & Work in Progress

**Done and working (all merged to `develop`, CI green):**
- **v0.1.0 Core** & **v0.2.0 Interface** — tagged/released. Static offline scaffold, the invariants + CI guards, the local-first data layer, the vendored calendar; the interactive retro **desktop** (window manager, dock, three token axes, bundled fonts, a11y floor, styled 404).
- **v0.3.0 Library — engine COMPLETE** (all 6 PRs): tiered content rendering, curated "See also" + "Surprise me", offline Pagefind search, inline `bosco:` cross-links + `gloss:` glossary with a doctrine gate, category landings + Archives shelf, and the offline AI content-authoring pipeline (`scripts/content/`). *Remaining is content, not code* (see below).
- **v0.4.0 Field Guide — engine 6/7 PRs merged:** FG-1 schema (`habitat`/`kind`), FG-2 album state (`recordOnce`), FG-3a hub + shared anchor-intercept, FG-3b axis routes, FG-4 record-on-read, FG-5 album view (records-not-rewards), **FG-6 anatomy hotspot diagram** (`d5cb339`, just merged as [PR #99]).

**What we were doing right now / immediate next step:**
- **FG-7 — Habitat range map** is the **last Field Guide engine PR.** Plan: add a `range` sub-schema `{ base, regions[], caption }`; extend `validateFieldGuide` to **parse the committed `static/maps/base.svg` at build** and validate each creature's `regions[]` against the SVG's real `<path id>` set (no hand-maintained mirror); bundle `static/maps/base.svg` (root-relative `/maps/base.svg`, SVGO-clean, credited in `CREDITS.md`); `RangeMap.svelte` (SVG/DOM — highlight + a static region `<ul>` + a no-JS `caption` as the truth); one reference range on red-fox; add the caption token to `check-offline.mjs`. Blueprint: [`docs/architecture/field-guide.md`](docs/architecture/field-guide.md) → "The habitat range map". After FG-7, **v0.4.0 is content-only.**

**Working tree:** **clean** at `d5cb339` — the *only* uncommitted change is this `CLAUDE.md` (committed by itself per the handoff instruction; the maintainer will push to the new Git server). `develop` currently matches `origin/develop` on GitHub (`github.com/BoscoApp/bosco`).

**Known open items / blockers:**
- **Content is the bottleneck**, paced by doctrinal review: the v0.3.0 3-topic proof + 18-topic launch set are still to be authored/approved (owner-paced). Only `creatures/red-fox` (+ `world/printing-press`) is approved and shipping; `creatures/basilisk-draft` is a deliberately `pending` gate fixture (never in production).
- **Illustration aesthetic is deferred to the owner** — all art surfaces render an `ArtFrame` placeholder; do not commit a chosen illustration style.
- **Signing on the new host:** commits are **SSH-signed** under the maintainer's identity. Register the SSH *signing* key on the new environment/Git server, or commits won't verify (and `main` requires signatures).
- `CLAUDE.local.md` (repo root, **gitignored, machine-local**) imports the maintainer's `~/.claude` workflow and points at plan/brief files that lived on the old machine — those paths won't exist here. Don't rely on them; this `CLAUDE.md` + the in-repo `docs/`, `ROADMAP.md`, `CONTRIBUTING.md` are the self-contained source of truth.

## Conventions & Gotchas

**The five invariants (never break these — CI enforces them):**
1. **Zero external network at runtime.** No CDN links, remote fonts, analytics, or `fetch` to another host. `guard:external` greps `build/`. External references belong only in frontmatter `sources` (metadata, never rendered as a live link). Never write an `http(s)://` link in article prose (the build rejects it) — cross-link with `bosco:category/slug` instead.
2. **Everything prerenders** (`adapter-static` `strict`). A non-prerenderable route fails the build.
3. **Local-first, no accounts, no server data.** Storage goes through `$lib/state` only.
4. **Doctrine never ships unreviewed.** `review_status: pending` (anything ≠ `approved`) is excluded from production builds. **Verbatim rule:** catechism, Scripture, prayers ship byte-for-byte; AI may adapt *stories/explanations*, never doctrinal text. `faith/**` is in `.github/CODEOWNERS`.
5. **Every third-party asset is credited** in `CREDITS.md` at add-time; unknown license ⇒ not committed.

**Coding standards:**
- **Design tokens only** — no hardcoded colours in components; use `var(--…)` from `src/lib/styles/tokens.css`. `guard:colour` fails literals (pure white/black + greyscale rgb/hsl are the only allowed literals).
- **Committed SVGs must be SVGO-clean** (no `xmlns:inkscape/sodipodi/cc/dc/rdf`, no `<metadata>`, only `www.w3.org` absolute URLs). `guard:svg` enforces it.
- Svelte 5 runes throughout. mdsvex bodies are trusted components — never `{@html}` of arbitrary strings. Match the surrounding code's density and idiom.
- The content/gate remark chain files (`src/lib/content/*.js`) are **plain JS on purpose** — `svelte.config.js` imports them without a TS step. Keep them `.js`.
- Prettier + ESLint are authoritative; run `pnpm lint` before committing. `pnpm check` must be 0 errors / 0 warnings (svelte-check treats a11y issues as warnings — keep it clean).

**Git / workflow (this project runs the "Full" tier — see `CONTRIBUTING.md`):**
- Branch from `develop` as `‹type›/‹area›-‹slug›` (e.g. `feat/field-guide-range-map`), open a PR into `develop`, squash-merge when `ci` is green. Releases are `develop` → `main`. **Do not commit feature work directly to `develop`.**
- **Conventional Commits** (`feat` / `fix` / `perf` / `refactor` / `docs` / `test` / `build` / `ci` / `chore` / `revert` / `content`). **PR titles are linted and drive release-please** — they must parse.
- **Attribution:** commit **only** under the maintainer's git identity, **SSH-signed**. **Never** add co-author trailers, "Generated with…" lines, tool emojis, or any assistant/AI references in commits, PRs, comments, or files. (GitHub's squash-merge re-authors to the maintainer's GitHub noreply identity and re-signs — that is expected.)

**Gotchas a new session must know:**
- **Playwright e2e is local-only** and needs a browser + a build: `pnpm exec playwright install --with-deps chromium`, then `pnpm test:e2e` (it builds and serves on 4173 itself). CI does *not* run it — the browser-free `guard:offline` is CI's offline proof.
- Pagefind indexing runs as part of `pnpm build`; a build with **0 search records fails** (it means the `data-pagefind-body` tag regressed). Expect a small record count (one per published topic).
- The desktop keeps all windows mounted (hidden via the `hidden` attribute), and the same shared `ArticleView` renders on prerendered routes *and* in windows — write host-agnostic components.
- This repo was developed on Windows (PowerShell); it is now on Linux. All tooling is cross-platform Node `.mjs`; line endings are governed by `.gitattributes`/`.editorconfig`. Nothing Windows-specific should remain, but prefer POSIX paths.
- Before a large change, read the relevant `docs/architecture/*.md` — the offline/prerender/state contracts are written down and are load-bearing.

## Project memory (carried over from the previous machine)

> This is durable, non-obvious context that lived in the maintainer's local auto-memory and plan file on
> the old machine — neither of which travels with the repo. Captured here so a fresh session has it.
> Point-in-time as of this handoff (`develop` @ `d5cb339`); verify against live state before asserting.

**Where the full spec lives.** The exhaustive 11-version roadmap, backlog, and rationale is the maintainer's
plan file (`~/.claude/plans/…` on the old machine — **won't transfer**). The committed equivalents that *do*
travel: [`ROADMAP.md`](ROADMAP.md) (the version table + backlog) and [`docs/architecture/*.md`](docs/architecture)
(the design contracts). Treat those as the source of truth here.

**Ratified design decisions (don't relitigate without the owner):**
- **Field Guide diagrams/maps use SVG/DOM, NOT PixiJS** (unanimous workshop call, 2026-07-11): a WebGL canvas
  renders nothing at prerender / with JS off (an offline-invariant hole) and is invisible to screen readers.
  PixiJS stays reserved for the *Art Studio's* raster needs (v0.6.0) and is not yet a dependency.
- **The Field Guide's second axis is `kind`, not `type`** (matches kid-facing copy; avoids the JS reserved word).
- **The card album is "records, not rewards"** — JS-only, gate-enforced: no count, percent, `<progress>`/`<meter>`,
  rarity, streak, or score. A silent record-on-read moment.
- **Illustration aesthetic is deferred to the owner.** Every art surface renders an `ArtFrame`/placeholder plate;
  the swap-point is one per asset class. Do not pick a style or commit an illustration.
- **Working method:** each substantive PR gets an adversarial multi-agent review (independent lenses → per-finding
  refutation) before merge; refuted-but-sound findings are often adopted as cheap defence-in-depth.

**GitHub tracking state** (`github.com/BoscoApp/bosco`, public, default `develop`):
- **12 milestones**, one per roadmap version: `v0.1.0`–`v1.2.0`. `v0.1.0`/`v0.2.0` **closed**; `v0.3.0`
  (Library) and `v0.4.0` (Field Guide) **open**; the rest are placeholders. (`v1.2.0 — Bosco OS` is a
  post-launch locked-down-Linux-appliance track — design note in the plan file.)
- **Org Projects v2 board = "Bosco Roadmap" (project #2)** with single-select fields (Version, Area, Track,
  Tier, Content-stage) — it is the status source of truth; the doctrinal-review-queue view is the owner's worklist.
- **Epics** carry `epic` + an `area:*` label and link work as native sub-issues. The live Field Guide epic is
  **[#92](https://github.com/BoscoApp/bosco/issues/92)** (FG-7 is its one open child). **Every content topic is
  its own issue** with exactly one `content:*` label mirroring its `review_status`; a content issue is Done only
  at `content: approved`.

**Release state & how to cut the next one.** `v0.1.0` and `v0.2.0` are tagged (SSH-signed annotated tags) with
GitHub Releases; `.release-please-manifest.json` is seeded to `0.2.0`, so **release-please is green** (nothing to
release). The `v0.3.0` Library and `v0.4.0` Field Guide engines are merged but **unreleased**. Releases have been
cut **manually** (see owner follow-up below re: the org Actions-PR policy that blocks automated release PRs). To
cut, e.g., `v0.3.0`: promote `develop` → `main`, `git tag -s v0.3.0` at the release commit, `gh release create`,
and set the manifest to `0.3.0`. `main` is protected and **requires signed, verified commits**.

**Owner follow-ups that survive the machine move (a Claude session can't do these):**
1. **Register the SSH _signing_ key on the new host/Git server and verify the maintainer's email**, or commits
   won't show "Verified" and the **first `main` release will be rejected** by branch protection. (Signing is
   distinct from the auth key; commits are already signed locally — `sig=G`.)
2. **Org policy "Allow GitHub Actions to create and approve pull requests"** is (was) off, which blocks automated
   release-please *and* Dependabot PRs. Not urgent while releases are hand-cut, but it's why release PRs are manual.

**Regenerating the liturgical calendar (out-of-band; NOT part of build/dev).** `src/lib/calendar/calendar.json`
is committed. To extend/regenerate it you need **PHP** and the sibling **introibo** repo (AGPL engine, CC0
corpus data — Bosco vendors *data*, never engine code). It was at `../introibo.org` on the old machine and is
**not part of this repo**; on the old Windows box PHP ran via WSL — on the new Linux container PHP is native.
Recipe: run `scripts/calendar/dump-contracts.php <introibo autoload.php> <start> <end> > dump.json`, then
`node scripts/calendar/vendor-calendar.mjs dump.json` → writes `calendar.json`. introibo's `1962` system is
`roman:rubricae-1960`; the observance `id` is the durable **Library↔Chapel join** key (a future Faith topic
declares the matching id). This is a rare, manual step — the committed JSON is what the app reads.

**Immediate next work** (also in "Current State" above): **FG-7 — habitat range map** is the last Field Guide
engine PR; then v0.4.0 is content-only. The standing content bottleneck (task-tracked as issues, owner-paced) is
the v0.3.0 3-topic proof + 18-topic launch set — engine-complete, awaiting authoring + doctrinal review.
