# Bosco

**A little offline internet for traditional Catholic kids (ages 4–16).**

Bosco is a 1990s-styled _Portal_ a child explores — a Library, a Field Guide, a Chapel, an Art
Studio, an Arcade, and a Typing Trainer — that runs **fully offline**. One codebase ships three
ways: a static public site, an installable PWA, and a self-hostable offline Docker image.

> Status: **v0.1.0 Core** — the static offline scaffold and the invariants that hold the whole
> project together. Nothing here is a public release yet. See [`ROADMAP.md`](ROADMAP.md).

## What holds it together (the invariants)

1. **Zero external network at runtime.** Every asset is bundled. A CI guard greps the built output
   and fails the build on any external URL. If it can't survive `docker run` with networking off, it
   doesn't ship.
2. **Fully prerendered.** SvelteKit + `adapter-static` in `strict` mode — a route that can't be
   prerendered fails the build.
3. **Local-first, no kid accounts.** The site sets no cookies and holds no server data; everything
   lives in the browser (localStorage + IndexedDB) with export/import backup. The only server surface
   is an _opt-in, parent-gated_ sync layer, arriving post-launch (v1.1.0) and off by default.
4. **Doctrine never ships unreviewed.** Content marked `review_status: pending` is excluded from
   production builds. The owner is the doctrinal reviewer. Catechism, Scripture, and prayers ship
   **verbatim** — AI adapts _stories_, never doctrinal text.
5. **Every third-party asset is credited** in [`CREDITS.md`](CREDITS.md) with license + source at
   add-time. Unknown license ⇒ not committed.

## Stack

SvelteKit (`adapter-static`, all routes prerendered) · mdsvex + a Zod content module · Pagefind
(offline search) · PixiJS (canvas + diagrams) · CSS design tokens (three `<html>` axes:
`data-theme` / `data-lit` / `data-tier`) · a build-time `sharp` media pipeline · a vendored
liturgical calendar from [introibo](https://github.com/) Core (CC0 data, generated out-of-band) ·
a multi-arch nginx Docker image (built at v1.0.0).

## Develop

```sh
pnpm install
pnpm dev            # dev server
pnpm build          # static build → build/
pnpm preview        # preview the static build
pnpm check          # svelte-check (type + a11y)
pnpm lint           # prettier + eslint
pnpm test:unit      # vitest
pnpm guard:external # fail on any external URL in build/
pnpm serve:static   # serve build/ like the production container
```

`pnpm` is managed via `packageManager` in `package.json` — run `corepack enable pnpm` once.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the branch/PR/commit conventions, the content review
state machine, and the doctrinal-review gate.

## License

The final license split (code + content) is decided before the v1.0.0 public launch — see the
launch-readiness epic in [`ROADMAP.md`](ROADMAP.md). Until then, © the project owner, all rights
reserved. Third-party assets keep their own licenses, recorded in [`CREDITS.md`](CREDITS.md).
