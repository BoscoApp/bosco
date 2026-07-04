# Credits

Every bundled third-party asset (font, icon, image, audio, library that ships in the build) is
recorded here **at the moment it is added**, with its license and source (brief §5 hard rule 4). An
asset with an unknown license does not get committed. AI-generated artwork is logged separately in
[`AI-ART.md`](AI-ART.md).

## Fonts (bundled via @fontsource, self-hosted, no CDN)

| Asset                 | Use                    | License                   | Source                                                                   |
| --------------------- | ---------------------- | ------------------------- | ------------------------------------------------------------------------ |
| Atkinson Hyperlegible | Body / reading text    | SIL Open Font License 1.1 | Braille Institute — https://github.com/googlefonts/atkinson-hyperlegible |
| Press Start 2P        | Chrome / headings only | SIL Open Font License 1.1 | CodeMan38 — https://fonts.google.com/specimen/Press+Start+2P             |

## Build-time tooling (does not ship in the static output — listed for hygiene)

| Tool                       | Role                                                     | License                                         |
| -------------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| SvelteKit + adapter-static | Framework / static build                                 | MIT                                             |
| mdsvex                     | Markdown-in-Svelte content                               | MIT                                             |
| Pagefind                   | Client-side offline search index (ships in `/pagefind/`) | MIT                                             |
| Zod                        | Frontmatter validation                                   | MIT                                             |
| sharp (libvips)            | Build-time image processing                              | Apache-2.0 (libvips LGPL-2.1) — build-time only |
| SVGO                       | SVG metadata stripping                                   | MIT                                             |

## Liturgical calendar

The 1962 calendar **data** is sourced from **introibo.org** ([github.com/Introibo-App](https://github.com/Introibo-App))
— the owner's sibling project, a validated 1962 / 1960-rubrics calendar engine. Its compiled calendar
output is **CC0-1.0** (public-domain dedication; calendar facts are not copyrightable in any case),
which is clean to vendor into Bosco.

`scripts/refresh-calendar.mjs` fetches whole years from introibo's public API
(`system=1962&calendar=universal&lang=la`), transforms each day to Bosco's shape, and writes the
committed `src/lib/calendar/data/calendar.json`. The exact upstream `dataVersion` for the vendored
snapshot is recorded in `src/lib/calendar/data/calendar.meta.json`.

- **Data license:** CC0-1.0 (introibo's compiled calendar output).
- **Engine:** the introibo engine itself is **AGPL-3.0** — Bosco consumes its data _output_ over the
  public API and vendors only that CC0 data; no engine code is ported or bundled.
- English display names for feasts and Sundays live in `src/lib/calendar/names.ts` (introibo ships
  Latin only); days without an English mapping fall back to the Latin name.

## Notes

- All shipped fonts are OFL 1.1 (bundling and redistribution permitted; reserved font names not
  reused by derivatives).
- No game/UI art or audio is committed yet (Phase 0 is art-agnostic — Open Decision #4). When added,
  default sources are Kenney.nl (CC0) for game/UI art and freesound (CC0-filtered) for audio.
