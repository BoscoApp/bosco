# Changelog

All notable changes to Bosco are recorded here. This file follows the
[release-please](https://github.com/googleapis/release-please) conventions so future releases append
cleanly; versions correspond to signed git tags cut from `develop`.

## [0.3.0](https://github.com/BoscoApp/bosco/compare/v0.2.0...v0.3.0) (2026-07-12)


### Features

* **field-guide:** album state module + recordOnce primitive (FG-2) ([#94](https://github.com/BoscoApp/bosco/issues/94)) ([b01568f](https://github.com/BoscoApp/bosco/commit/b01568f01f02074311eba702eef610613f2a8295))
* **field-guide:** album view — records-not-rewards card grid (FG-5) ([#98](https://github.com/BoscoApp/bosco/issues/98)) ([b1da2a3](https://github.com/BoscoApp/bosco/commit/b1da2a35fbb5bff65debcbf2fbba72034b5d72e9))
* **field-guide:** anatomy hotspot diagram — SVG/DOM, no-JS-complete (FG-6) ([#99](https://github.com/BoscoApp/bosco/issues/99)) ([d5cb339](https://github.com/BoscoApp/bosco/commit/d5cb339d56f549538d881e7561914f66cd1de39b))
* **field-guide:** creature habitat/kind schema (FG-1) ([#93](https://github.com/BoscoApp/bosco/issues/93)) ([4fbeb6d](https://github.com/BoscoApp/bosco/commit/4fbeb6dff4ea75a3ac87bda378467c3cde0a082a))
* **field-guide:** habitat & kind axis routes (FG-3b) ([#96](https://github.com/BoscoApp/bosco/issues/96)) ([ee48802](https://github.com/BoscoApp/bosco/commit/ee4880251df20e07f064a5e656c12cde8745804e))
* **field-guide:** hub route + window activation + shared anchor-intercept (FG-3a) ([#95](https://github.com/BoscoApp/bosco/issues/95)) ([85c03d1](https://github.com/BoscoApp/bosco/commit/85c03d1f5494f0a10c5aea1d41f1f09d2f00a81d))
* **field-guide:** record-on-read wiring for the card album (FG-4) ([#97](https://github.com/BoscoApp/bosco/issues/97)) ([c344125](https://github.com/BoscoApp/bosco/commit/c344125be34f9d35a21824a79af34be1eae0b26b))
* **library:** AI content pipeline tooling (offline seam + verbatim doctrine guard) ([#91](https://github.com/BoscoApp/bosco/issues/91)) ([09bb8ac](https://github.com/BoscoApp/bosco/commit/09bb8acf4627f07a83f361aa3e367b9ea3b514cc))
* **library:** category landing enrichment + Archives shelf + illustration seam ([#90](https://github.com/BoscoApp/bosco/issues/90)) ([c6a85a5](https://github.com/BoscoApp/bosco/commit/c6a85a5d4d91187638f21b1cf459267714be6d0b))
* **library:** curated "See also" + "Surprise me" ([#86](https://github.com/BoscoApp/bosco/issues/86)) ([c19f69b](https://github.com/BoscoApp/bosco/commit/c19f69b204dbf5433dab1264e69b8e3995ed2485))
* **library:** glossary terms (gloss:) + accessible toggletip + doctrine gate ([#89](https://github.com/BoscoApp/bosco/issues/89)) ([afdec69](https://github.com/BoscoApp/bosco/commit/afdec6969dfe435803a3f5b551d8db12bcf5cdda))
* **library:** inline cross-links via bosco: protocol ([#88](https://github.com/BoscoApp/bosco/issues/88)) ([3d106ae](https://github.com/BoscoApp/bosco/commit/3d106aee1d5ed0d5096435e961820b06b8b06dc3))
* **library:** offline search via Pagefind ([#87](https://github.com/BoscoApp/bosco/issues/87)) ([929f06e](https://github.com/BoscoApp/bosco/commit/929f06e71858e0def6b17fa4c3c07a2ca8305d58))
* the Library — tiered content rendering ([#85](https://github.com/BoscoApp/bosco/issues/85)) ([3c972d4](https://github.com/BoscoApp/bosco/commit/3c972d43d4dd9be733a4aa79af5187f4bcec4de7))

## [0.2.0](https://github.com/BoscoApp/bosco/compare/v0.1.0...v0.2.0) (2026-07-06)

The **Interface** — the interactive retro "desktop" you explore. A calendar-driven wallpaper, a menu
bar and app-icon dock, draggable windows, named profiles with an avatar generator, and a reading-level
switch, all offline and keyboard-accessible.

### Features

- design tokens, theme axes, and bundled fonts ([#81](https://github.com/BoscoApp/bosco/pull/81)) ([40fff1a](https://github.com/BoscoApp/bosco/commit/40fff1a))
- the Bosco desktop — interactive Portal shell ([#82](https://github.com/BoscoApp/bosco/pull/82)) ([755b50c](https://github.com/BoscoApp/bosco/commit/755b50c))
- accessibility floor and a styled 404 ([#83](https://github.com/BoscoApp/bosco/pull/83)) ([352d278](https://github.com/BoscoApp/bosco/commit/352d278))

## 0.1.0 (2026-07-06)

The **Core** — a static, fully-offline SvelteKit scaffold with the content, state, and calendar spine
in place: a Zod content module that gates unreviewed doctrine out of production builds, a local-first
sync-ready data layer, a vendored 1962 liturgical calendar, and the `ci` offline-invariant guards.

### Features

- scaffold the static offline app, governance, and CI gate ([#61](https://github.com/BoscoApp/bosco/pull/61)) ([0a3a617](https://github.com/BoscoApp/bosco/commit/0a3a617))
- content module, local-first state, and vendored calendar ([#62](https://github.com/BoscoApp/bosco/pull/62)) ([36ed9f9](https://github.com/BoscoApp/bosco/commit/36ed9f9))
