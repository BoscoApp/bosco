# Static output contract (Docker-ready)

Bosco's build produces a **plain directory of static files** (`build/`) with no server-side runtime.
That directory is the single artifact three delivery targets share:

1. the public static site (DreamHost + Cloudflare),
2. the installable PWA (same files + a service worker, v1.0.0),
3. the self-hostable **offline Docker image** (nginx serving `build/`, built at v1.0.0).

Architecting to this contract from commit one means the container is a packaging step later, not a
re-architecture. The offline smoke (`pnpm guard:offline`) serves `build/` with a zero-dependency Node
server that mimics the container's behaviour, so nginx-later parity is verified continuously.

## The contract

- **Output:** `build/` — prerendered HTML per route, hashed immutable assets, `favicon.svg`,
  `robots.txt`, and any bundled data (e.g. the calendar chunk).
- **Clean directory URLs:** routes emit `path/index.html`; `trailingSlash: 'always'` keeps relative
  asset paths resolving from any depth. The server maps `/x/` → `/x/index.html`.
- **No SPA catch-all:** there is no `fallback.html`. A missing path is a real 404 (a styled 404 page
  arrives in v0.2.0). This keeps the URL space honest and prerender-complete.
- **Immutable hashed assets** under `build/_app/immutable/` are safe to cache forever; HTML is not.
- **Zero external references** in any served file (enforced — see [offline-invariant.md](offline-invariant.md)).

## What the eventual nginx config must do (v1.0.0)

- Serve `build/` as web root; `index.html` as directory index.
- `try_files $uri $uri/ =404` (no SPA rewrite).
- Long-lived `Cache-Control: immutable` for `/_app/immutable/*`; `no-cache` for `.html`.
- Correct MIME types (incl. `.webmanifest`, `.woff2`); optional precompressed assets.
- Runs with networking disabled — verified in CI when the image is introduced.

Until then, `scripts/serve-static.mjs` is the reference server for these rules.
