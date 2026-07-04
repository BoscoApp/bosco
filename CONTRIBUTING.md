# Contributing to Bosco

**Workflow:** Full

This project follows the **Full** development-workflow tier: a hard production gate on `main`,
automated versioning/releases (release-please), and CI/CD. Coordination is by **visibility, not
approvals** — assigning yourself an issue is the claim; reviews may be requested but are never
required.

## Branches

- **`main`** = production (gated: required checks, signed commits, protected tags). Never push directly.
- **`develop`** = the default working branch (ungated).
- **`feature/<id>-<slug>`** off `develop` → PR into `develop`.
- **`hotfix/<id>-<slug>`** off `main` → PR into `main`, then back-merge to `develop`.

## Issues & claiming work

- Real work gets a GitHub Issue with a clear title, the problem, and **acceptance criteria**.
- **Claim by assigning yourself.** Unassign if you set it down.
- Link the issue from its PR with `Closes #N`.
- Labels: `type: feature|enhancement|perf|fix|security`, `breaking`, plus `priority:*`, `area:*`,
  status labels, and `epic` for tracking issues.

## Commits & PRs

- **Conventional Commit** squash titles: `<type>(scope): description (#N)` — enforced by the
  `pr-title` check. `feat` → minor, `fix`/`perf` → patch, `!`/`BREAKING CHANGE:` → major.
- Keep PRs small and one logical change. **Squash-merge** feature/fix PRs; the `develop` → `main`
  release PR uses a **merge commit** so release-please can read the individual commits.
- Commit only under your own git identity; no co-author trailers or generated-with lines (see
  **Commit hygiene** below).

## Definition of Done

Issue linked + milestoned · acceptance criteria met · **CI green** (lint, typecheck, test, build,
`no-external-urls`, offline smoke) · no new runtime external requests · new assets logged in
`CREDITS.md`/`AI-ART.md` · faith content `review_status` correct · docs/ROADMAP updated · valid
Conventional Commit title · self-reviewed the full diff · committed under your own identity.

## Run commands

```sh
npm ci
npm run dev
npm run build
npm run check:offline
npm test
npm run build && npm run test:e2e
```

Node 24 required. See [`README.md`](README.md) for details and the Docker workflow.

## The offline invariant

Everything must work from `docker run` with networking disabled. The `check:offline` CI step greps
the built output for external URLs and **fails the build** if any exist. If a library or asset would
force an external request, find another or bundle it. Every third-party asset is recorded in
`CREDITS.md` at the moment it is added.

## Commit hygiene

Commit only under your own git identity. Don't add co-author trailers or "generated-with" lines, and
keep editor/tooling working files out of the repo via your machine's global gitignore
(`core.excludesfile`), never a committed `.gitignore`.

## Planning surface

`ROADMAP.md` + version milestones are live now. The Projects v2 board, destination **epics** with
sub-issues, and the epic-rollup automation (needs `PROJECTS_PAT`) are stood up at **Phase 1 kickoff**
when parallel content work earns them — graduation is additive, nothing here changes.
