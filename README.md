# Bosco — bosco.kids

A 90s-styled, offline-capable "mini internet" for Catholic kids — a walled garden of learning, art,
games, and faith formation through a traditional Catholic lens. Not one app but a **Portal** with
destinations: a tiered-reading-level Library, a nature Field Guide, an Art Studio, an Arcade, a
Typing Trainer, and a Chapel built on the traditional (1962) liturgical calendar.

It ships three ways from one codebase, byte-for-byte the same experience:

1. **Public website** — static files on shared hosting, zero accounts, zero data collection.
2. **PWA** — installable, offline-resilient on the kid's own device.
3. **Docker image** — `docker run` gives a family or school the whole thing, fully offline.

> **If a feature can't survive `docker run` on an offline laptop, it doesn't ship.**

## Status

**Phase 0 — Decisions & skeleton.** The Portal shell, design tokens, content schema + tier
rendering, the 1962 liturgical calendar, the offline-invariant CI guardrail, and the multi-arch
Docker image. See [`ROADMAP.md`](ROADMAP.md).

## Develop

Requires **Node 24**.

```sh
npm ci
npm run dev            # dev server (search is inactive in dev — see below)
npm run build          # prebuild (calendar + media) -> vite build -> pagefind index
npm run check:offline  # fail if the built output contains any external URL
npm test               # unit tests (vitest)
npm run build && npm run test:e2e   # Playwright offline smoke against the built site
```

Search (Pagefind) indexes the built HTML, so it only works after `npm run build` (or in Docker), not
in `vite dev`.

### Preview an unreviewed-content build

Faith and other content marked `review_status: pending` is excluded from the production build by
default (doctrine does not ship unreviewed). To preview it:

```sh
VITE_INCLUDE_PENDING=true npm run build
```

## Run with Docker (fully offline)

```sh
docker build -t bosco:local .
docker run --rm --network none -p 8080:80 bosco:local
# open http://localhost:8080
```

See [`docker/README.md`](docker/README.md).

## Non-negotiables (brief §5)

- Zero external network requests at runtime — everything bundled, enforced by CI (`check:offline`).
- No cookies, no accounts, no forms that transmit data — `localStorage` only.
- Every third-party asset is recorded in [`CREDITS.md`](CREDITS.md) with license + source when added.
- Faith content is human-reviewed before it ships; `pending` content is build-excluded by default.

## Licensing

Split license: **code MIT**, **original content CC BY-NC-SA 4.0**. See [`LICENSING.md`](LICENSING.md).

## Contributing

Development follows the **Full** workflow tier — see [`CONTRIBUTING.md`](CONTRIBUTING.md).
