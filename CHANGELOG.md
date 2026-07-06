# Changelog

All notable changes to Bosco are recorded here. This file follows the
[release-please](https://github.com/googleapis/release-please) conventions so future releases append
cleanly; versions correspond to signed git tags cut from `develop`.

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
