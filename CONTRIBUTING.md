# Contributing to Bosco

**Workflow:** Full

Bosco is a single-maintainer project with production-grade tracking: a version-per-pillar roadmap,
epics with sub-issues, a project board, a required CI gate, automated release PRs, and a protected
`main`. This document is the working agreement.

## Branches

- **`develop`** — the integration branch. Ungated; all work merges here first.
- **`main`** — protected, release-only. Requires signed commits, a PR, and the `ci` check. Promoted
  from `develop` at a release.

Working branches are named **`‹type›/‹area›-‹slug›`**, e.g. `feat/library-tiered-rendering`,
`content/creatures-red-fox`, `chore/repo-bootstrap`. Open a PR into `develop`, squash-merge when `ci`
is green. Releases are `develop` → `main`.

## Commits & PR titles — Conventional Commits (+ `content:`)

Format: `type(scope): summary`. Types:

`feat` · `fix` · `perf` · `refactor` · `docs` · `test` · `build` · `ci` · `chore` · `revert`
· **`content`** (authoring/reviewing a topic, prayer, catechism entry, etc.)

`feat!` or a `BREAKING CHANGE:` footer marks a breaking change. **PR titles are linted by `ci`** and
drive release-please, so they must parse.

## The `ci` check (one required status)

`ci` runs on every PR and must be green before merge. It bundles:

- `pnpm check` — svelte-check (types + a11y)
- `pnpm lint` — prettier + eslint
- `pnpm build` — all routes prerender, or the build fails
- `pnpm guard:external` — **no external URLs** in the built output (the offline invariant)
- `pnpm test:unit` — vitest
- PR-title lint — Conventional Commits

Everything must also survive `docker run` with networking disabled; the guard + prerender contract
enforce that at build time.

## Content: the review state machine

Every content **topic is its own issue** and carries exactly one `content:` label mirroring its MDX
`review_status`:

```
content: drafting → content: needs-review → content: needs-doctrinal-review
       → content: changes-requested → content: approved
```

- **A content issue is Done only at `content: approved`.**
- `review_status: pending` (anything not `approved`) is **excluded from production builds** — proven by
  `ci`. Doctrine never ships unreviewed.
- **Verbatim rule:** catechism, Scripture, and prayers ship **verbatim**. AI may adapt _stories_ and
  general explanations, never doctrinal text.
- Files under doctrine paths (`src/content/faith/**`, `chapel`, `prayers`, `catechism`) are owned in
  [`.github/CODEOWNERS`](.github/CODEOWNERS), so every doctrine change requests the owner's review.

## Releases

`release-please` watches `develop` and opens a release PR as conventional commits land. Merging it
tags the version and updates the changelog. Pre-1.0 until the v1.0.0 launch gate.

## Attribution

Commit only under the maintainer's git identity, SSH-signed. **No co-author trailers, "Generated
with…" lines, tool emojis, or assistant references** in commits, PRs, comments, or files.

## Tracking

- **Milestone per version** (v0.1.0 … v1.1.0).
- **Epics** carry `epic` + an `area:*` label and link their work as native sub-issues.
- The **project board** is the source of truth for status; the doctrinal-review queue view is the
  owner's worklist.
