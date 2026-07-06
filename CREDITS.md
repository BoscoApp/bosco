# Credits

Every third-party asset and data source is logged here **at the time it is added**, with its license
and origin. **Unknown license ⇒ not committed.** This is a hard rule (see `README.md`).

## Data

| Asset                                                                                                 | Used for                                                                             | License                                                             | Source                                                    |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------- | --------------------------------------------------------- |
| introibo Core — 1962 liturgical corpus (corpus `1962-2026-07-02.1`, contract `1.0.0`, engine `0.4.0`) | The vendored `src/lib/calendar/calendar.json` (2026 feasts, ranks, colours, seasons) | CC0 1.0 (corpus data only; the engine is AGPL and **not** vendored) | introibo Core, via `contract()` — see `scripts/calendar/` |

## Fonts

Self-hosted, subset to woff2, and served same-origin from `/fonts/` (never a CDN — see
`guard:external`). Declared in `src/lib/styles/fonts.css`.

| Asset                                                                    | Used for                                          | License                   | Source                                                                                             |
| ------------------------------------------------------------------------ | ------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------- |
| Atkinson Hyperlegible (regular, bold, italic; latin + latin-ext subsets) | Body & UI text — drawn for high legibility        | SIL Open Font License 1.1 | Braille Institute of America, via Google Fonts (`fonts.google.com/specimen/Atkinson+Hyperlegible`) |
| Press Start 2P (regular; latin subset)                                   | Retro display accent (wordmark, kickers, counter) | SIL Open Font License 1.1 | CodeMan38, via Google Fonts (`fonts.google.com/specimen/Press+Start+2P`)                           |

## Images & audio

_None yet. Illustration production begins at v0.3.0; each asset (public-domain source, AI-generated,
or CC0) is recorded here as it lands, per-theme where applicable._

## Code / libraries

Third-party runtime and build dependencies are declared in `package.json` and locked in
`pnpm-lock.yaml`; their licenses are those published on npm. This table records assets that are
**bundled into the shipped site** beyond ordinary dependencies.
