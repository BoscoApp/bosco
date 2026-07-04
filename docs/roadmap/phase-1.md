# Phase 1 — detailed breakdown (1a proof → 1b breadth)

Human companion to the GitHub backlog. Phase 1 is split into a **thin proof slice (1a)** and a
**breadth pass (1b)** so the tier + content loop is proven on a handful of topics before it is scaled
— the honest risk in this project is content review (owner is the doctrinal reviewer), not code.

- Board: <https://github.com/orgs/BoscoApp/projects/1>
- 1a milestone: [v0.2.0](https://github.com/BoscoApp/bosco/milestone/2) · 1b milestone:
  [v0.3.0](https://github.com/BoscoApp/bosco/milestone/3)

Issue numbers below auto-link on GitHub.

## Phase 1a — the proof · [v0.2.0](https://github.com/BoscoApp/bosco/milestone/2)

**Done when:** a real 6-year-old and a real 10-year-old each spend 20 unassisted minutes and want to
come back; runs offline via Docker; parent trust page live; CI green.

### ✅ E0 — Repo hardening (#13, done)

Public repo; `main` production gate + `required_signatures`; commit signing; secret scanning + push
protection; Bosco favicon; styled 404; Dependabot triage (+ a `cookie` security override). Shipped
via #7 and the Dependabot bump PRs.

### ✅ E1 — Calendar: introibo integration (#14, done)

The 1962 calendar is now sourced from **introibo.org** CC0 data, replacing the Phase-0 hand-rolled
approximation. Design: [`../design/calendar-introibo.md`](../design/calendar-introibo.md). Shipped via
#10.

### ✅ E2 — Library engine + tier UI (#15, done)

Made the Library skeleton a usable engine. (Archives-shelf rendering is deferred to 1b.) Shipped via
#57.

- ✅ #16 — per-article tier override via `#tier=`
- ✅ #17 — cross-links & "See also" between articles
- ✅ #18 — token-theme the Pagefind search UI
- ✅ #19 — category landing pages

### E3a — Six reviewed proof topics (#20)

Prove the three-tier shape end to end on ~6 topics (creatures / faith / world) — not the industrial
pipeline (that is 1b). **Article art: deferred per Decision #4 (#36) — decorative/typographic only in 1a.**

- #21 — choose the six proof topics
- #22 — author tier-1/2/3 for the six topics
- #23 — doctrinal review pass (flip `review_status` to reviewed)
- #24 — map Faith topics to calendar ObservanceIds (the `names.ts` Library↔calendar join, feeds E6)

### E5a — Art Studio: coloring + print (#25)

A coloring canvas kids can use offline and **print** — the physical "fridge" artifact. **Line-art
templates: deferred per Decision #4 (#36) — a blank canvas in 1a.**

- #26 — canvas with brush + flood-fill
- #27 — load a line-art template as a locked layer
- #28 — PNG export (File System Access API + download fallback)
- #29 — print button

### ✅ E6 — Liturgical theming + Portal calendar link (#30, done)

Joined the introibo calendar (E1) to the Library engine (E2). Each day carries its introibo
ObservanceId through the vendored calendar; a Faith topic declares the matching `observanceId` in
frontmatter and the join links them. Shipped via #59.

- ✅ #31 — Saint-of-the-Day links to its Library Faith article (via the `names.ts` ObservanceId join)
- ✅ #32 — polish season & liturgical theming (accent now applied app-wide, colour swatch)
- ✅ #33 — Portal calendar surface (today + a curated "Coming up" look-ahead)

_Upstream note: introibo emits Nov 2 as a second All Saints instead of All Souls' Day (1962
universal); flagged for an introibo fix, then a Bosco re-vendor + `names.ts` correction._

### E7 — Parent trust page (#34)

- #35 — author the parent trust page: named sources, review process, verbatim-doctrine promise,
  zero-data / no-accounts posture

### ✅ Decision #4 — illustration treatment (#36) — deferred

**Decided 2026-07-04: defer, placeholder-first.** Phase 1a ships decorative/typographic art only —
no representational article images, a blank coloring canvas — and the illustration direction
(commissioned, AI-assisted logged in `AI-ART.md`, curated CC0, or a defined house style) is revisited
after the proof loop is validated. So E3a and E5a proceed now without art.

## Phase 1b — breadth · [v0.3.0](https://github.com/BoscoApp/bosco/milestone/3)

Epic headers only; sub-issues are fleshed at 1b kickoff.

- #37 — industrial content pipeline (source → tier adaptation → doctrinal review, at volume)
- #38 — scale to 18 topics
- #39 — Field Guide + card album
- #40 — full Art Studio (stamps, sound, undo)
- #41 — first Archives shelves

## Board automation (note)

The board is populated with every epic and Phase-1a sub-issue. Projects v2's built-in workflows
(auto-add new issues, item-closed → **Done**) are toggled in the board's web UI. Cross-issue **epic
progress rollup** is deferred until it is worth wiring a `PROJECTS_PAT` — GitHub already renders
sub-issue progress on each epic in the meantime.
