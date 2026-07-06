# The offline invariant

> If a feature can't survive `docker run` on an offline laptop, it doesn't ship.

Bosco makes **zero external network requests at runtime**. This is a hard rule (brief §5), and it is
enforced mechanically so it can't erode silently.

## How it's enforced

| Layer                             | Mechanism                                                                                                                                    | Where                                                            |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Every route is a static file      | `adapter-static` with `strict: true`; a non-prerenderable route fails the build                                                              | `svelte.config.js`, `src/routes/+layout.ts` (`prerender = true`) |
| No external references in output  | The external-URL guard greps `build/` and fails on any `http(s)://` or protocol-relative resource reference (w3.org XML namespaces excepted) | `scripts/check-external-urls.mjs` → `pnpm guard:external`        |
| Static output actually serves     | The offline smoke serves `build/` with a zero-dependency Node server and checks every route responds with no backend                         | `scripts/check-offline.mjs` → `pnpm guard:offline`               |
| Runtime makes no off-origin calls | Playwright aborts any non-localhost request and asserts none occurred                                                                        | `tests/e2e/offline.spec.ts` (local / pre-release)                |
| The vendored calendar             | Committed `calendar.json`, read from the bundle — never a live API                                                                           | `src/lib/calendar/`, `scripts/calendar/`                         |

The first three run in the required `ci` check on every PR.

## What "external" means

External = anything that would leave the origin: absolute `http(s)://` URLs, protocol-relative
`//host` URLs, CDN scripts/styles/fonts, remote images, `fetch`/`XHR`/WebSocket/EventSource to
another host. Same-origin (`/x`, `./x`, `#frag`), `data:` URIs, and XML/SVG namespace URIs are fine.

## Consequences for authoring

- **Bundle every asset.** Fonts self-hosted + subset; images processed by the build pipeline; no
  third-party embeds. Log each asset in `CREDITS.md`.
- **No analytics beacons, no remote config, no telemetry** in the static app.
- The only server surface Bosco ever grows is the **opt-in, parent-gated sync** layer (v1.1.0),
  which lives outside the static core and is off by default. See [state-and-sync.md](state-and-sync.md).
