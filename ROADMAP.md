# Bosco Roadmap

Each **version is one complete pillar**. Versions gate on completion (no dates); each ends shippable.
Each version is a GitHub **milestone**; its epics carry `epic` + an `area:*` label and track work as
native sub-issues. Content topics are individual issues that close only at `content: approved`.

| Version    | Name                     | Done when                                                                                                                                                                                                                     |
| ---------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **v0.1.0** | Core                     | Static offline scaffold, Zod content schema + `review_status` gating (proven on 2–3 dummy topics), the local-first sync-ready data layer, vendored `calendar.json`, and the `ci` guard all green; no image yet.               |
| **v0.2.0** | Interface Design         | Design tokens + Clubhouse theme + Portal shell; tier switch + theme persist; `data-lit` recolours the app offline; Saint-of-the-Day reads the calendar; fonts bundled; a11y floor met.                                        |
| **v0.3.0** | Library                  | Any approved topic renders at all three tiers + per-article override; Pagefind search works offline; category + Archives-shelf UI; the 3-topic proof + the AI pipeline + the 18-topic launch set, every faith topic approved. |
| **v0.4.0** | Field Guide              | Habitat/type index over approved creatures; the profile-scoped card album (records, no incentives); ≥1 hotspot diagram + range map (placeholder art), keyboard-accessible; offline.                                           |
| **v0.5.0** | Chapel                   | 1962 calendar browser; saint-of-the-day → its tiered article via the observance-id join; prayer book (Latin/English, verbatim); Baltimore Catechism corner (No.1/2/3 → tiers, verbatim); faith set approved.                  |
| **v0.6.0** | Art Studio               | Brush/eraser/fill/stamps/undo + coloring mode; PNG export (FS Access + fallback); **print button**; save-to-profile; genuinely-good tablet touch; offline.                                                                    |
| **v0.7.0** | Typing Trainer           | Home-row→passages progression, live WPM/accuracy, profile-persisted, keyboard-gated (graceful on touch), packs from site content. Built as a **reusable engine**.                                                             |
| **v0.8.0** | Arcade + Game 1          | Arcade shell + local/profile high-score tables; **Typing Defense** fully finished (reuses the typing engine), desktop + tablet, offline.                                                                                      |
| **v0.9.0** | Game 2                   | **Saint-and-Symbol Memory Match** fully finished (reuses the arcade shell), teaches stained-glass symbols, offline.                                                                                                           |
| **v1.0.0** | Polish + Docker + launch | Both themes live; parent trust page; PWA; WCAG AA + perf audit; the multi-arch offline **Docker container**; license split + CREDITS audit + CI green. **Public-launch gate.**                                                |
| **v1.1.0** | Opt-in Sync + accounts   | Parent-gated sync works two ways (public + self-hosted), app fully usable with sync off; privacy policy live; off-by-default proven.                                                                                          |

## Cross-cutting workstreams

- **Illustration production** (v0.3.0–v0.5.0) — art is a **theme axis**: Clubhouse = pixel/AI;
  Meadow = naturalistic public-domain-first + AI gap-fill + a consistency pass; **sacred subjects =
  public-domain devotional in both themes, never AI.** Final look signs off on real assets at v0.3.0.
- **Deploy & hosting** — CI deploy of the static artifact to DreamHost + Cloudflare + the `bosco.kids`
  domain; scaffolded in Core, go-live at v1.0.0.
- **Content provenance gate** — pin the exact public-domain editions (catechism, Douay-Rheims,
  Butler's) before ingest, feeding `CREDITS.md`.
- **Doctrinal-review preview loop** — a preview build of `pending` content so the owner reviews in situ.
- **Easter eggs & hidden pages** — seeded in v0.2.0, grown opportunistically (discovery is the
  engagement model).

## Beyond v1.1.0 (depth backlog)

Memory-work mode · the Sacristy · My Room gallery · chant/recorded prayer audio · portal calendar
batch · printable packs · content scale toward 100+ topics · the Seedling pre-reader shell. Post-1.0
tracks with placeholders: **Arcade expansion**, **Interactive Explorers**, **Activity packs** —
fleshed into epics when we reach them.

---

The full epic → issue backlog and the GitHub tracking model live in the approved project plan and are
created as milestones, epics, and issues on the tracker.
