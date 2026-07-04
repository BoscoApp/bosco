# Roadmap

_Where Bosco is headed. Phases gate on completion, not calendar; each phase ends shippable._

The backlog lives in GitHub: each version below links its **milestone**, and work is tracked as
**epics → sub-issues** on the [Bosco project board](https://github.com/orgs/BoscoApp/projects/1).

## ✅ Foundation — [v0.1.0](https://github.com/BoscoApp/bosco/milestone/1) (Phase 0 — Decisions & skeleton)

**The skeleton that enforces the promises.** SvelteKit static scaffold, design-token system (both
theme hooks + liturgical colours), the versioned localStorage state module, the content schema with
`review_status` gating and the `archives[]` field, the Portal shell with a working reading-level
switch, the external-URL CI guardrail, and the multi-arch Docker image. Complete and validated;
released as the first tag when Phase 1a lands.

## 🚧 In progress — [v0.2.0](https://github.com/BoscoApp/bosco/milestone/2) (Phase 1a — The proof)

A **thin vertical slice** that proves the tier + content loop before scaling. Deliberately de-risked
for a solo pace: ~6 reviewed topics, not 18.

- ✅ **E0 — Repo hardening:** public repo, `main` production gate + required signatures, commit
  signing, secret scanning, favicon, styled 404, Dependabot triage.
- ✅ **E1 — Calendar via introibo:** the 1962 calendar now uses authoritative **CC0 data from
  [introibo.org](https://github.com/Introibo-App)**, replacing the Phase-0 approximation — see
  [`docs/design/calendar-introibo.md`](docs/design/calendar-introibo.md).
- ✅ **E2 — Library engine + tier UI:** per-article tier override (`#tier=`), "See also" cross-links,
  token-themed offline search, and category landing pages — shipped via #57.
- ✅ **E6 — Liturgical theming & calendar link:** today's liturgical colour themes every page, the
  Saint-of-the-Day links to its Library article, and a Portal "Coming up" look-ahead of feasts —
  shipped via #59.
- **E3a — six reviewed topics** · **E5a — Art Studio (coloring & print)** · **E7 — parent trust page**.
- ✅ **Decision #4 (illustration treatment): deferred** (2026-07-04) — Phase 1a ships
  decorative/typographic art only (placeholder-first); the direction is revisited after the proof
  loop ([#36](https://github.com/BoscoApp/bosco/issues/36)). So E3a/E5a proceed now without art.

**Done when:** a real 6-year-old and a real 10-year-old each spend 20 unassisted minutes and want to
come back; runs offline via Docker; parent trust page live. Full 1a/1b breakdown in
[`docs/roadmap/phase-1.md`](docs/roadmap/phase-1.md).

## 🗓️ Next — [v0.3.0](https://github.com/BoscoApp/bosco/milestone/3) (Phase 1b — Breadth)

Turn the proof into a product: the **industrial AI content pipeline** (source → tier adaptation →
doctrinal review), **scale to 18 topics × 3 tiers**, the **Field Guide + card album**, the **full Art
Studio** (stamps, sound, undo), and the first **Archives** shelves.

**Done when:** the Library holds 18 reviewed topics and the content pipeline is repeatable.

## 🔭 Later — [v0.4.0](https://github.com/BoscoApp/bosco/milestone/4) (Phase 2 — Depth) · public-launch gate

Typing Trainer, two finished Arcade games, memory-work mode (Chapel drills + progressive
word-hiding), Chapel expansion (prayer book, calendar browser), the Seedling pre-reader shell, named
device-local profiles, the card album across destinations, PWA service worker, and the **Meadow**
theme. **Public launch at the end of Phase 2 at the earliest, with both themes live.**

## 🌠 Later — [v1.0.0](https://github.com/BoscoApp/bosco/milestone/5) (Phase 3 — Breadth & polish)

Content scale-up toward 100+ topics, recorded prayers/chant, print/PDF packs, The Sacristy, My Room
gallery, optional Kiwix shelf, and a full accessibility + performance audit.

## ✅ Released

_None yet — the first tag cuts with Phase 1a._
