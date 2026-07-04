# Calendar integration: introibo.org

Bosco's liturgical calendar (Saint-of-the-Day + season colour, brief §2.1) is sourced from
**[introibo.org](https://github.com/Introibo-App)** — the owner's sibling project, a validated
1962 / 1960-rubrics calendar engine. This document records the integration design; the code lives in
`src/lib/calendar/` and `scripts/refresh-calendar.mjs`.

## Why introibo, and why _vendored data_

Phase 0 shipped a hand-rolled computus + a curated fixed-feast subset — enough to prove the shape, but
an approximation (no full sanctoral, simplified precedence). introibo implements the real 1962 rubrics.

We vendor introibo's **compiled data output**, not its engine:

- introibo's compiled calendar data is dedicated **CC0-1.0** (and calendar facts are not copyrightable
  in any case) → clean to bundle into Bosco (MIT + content CC).
- The introibo **engine** is **AGPL-3.0**. Bosco consumes introibo's data _output_ over its public API
  and vendors only that CC0 data. **No engine code is ported or bundled.**

## The offline invariant is preserved

`scripts/refresh-calendar.mjs` runs **by hand** (`npm run refresh:calendar`), never at build time. It
fetches whole years from `https://introibo.org/api/v1/year/{year}` with
`system=1962&calendar=universal&lang=la`, transforms each day, and writes the **committed**
`src/lib/calendar/data/calendar.json`. The app (`src/lib/calendar/index.ts`) imports that committed
file — so the build and runtime make **zero network requests**. `prebuild` no longer regenerates the
calendar; the external-URL guardrail + Playwright offline smoke still pass.

- `calendar=universal` (never `sspx`) — Bosco carries no SSPX branding.
- `lang=la` — introibo ships Latin names only; English comes from `names.ts` (below).

## The contract we consume

Per day, introibo returns `data.season` (e.g. `"advent"`, `"pentecost"`) and `data.celebration[]`,
whose first element is the winning office:

```
celebration[0] = {
  id,           // stable ObservanceId, e.g. "roman:sanctorale:ioannes-bosco"
  rank,         // "I".."IV"        rankOrdinal 1..4  (1 = highest / Class I)
  kind,         // "feast" | "sunday" | "feria" | "within-octave" | "ember-day" | "vigil" | ...
  colour: { base, roseAllowed },
  names: { la } // Latin
}
```

## Transform → Bosco `{ season, color, feast, rank }` (`transform.ts`)

**Colour** (validated against introibo 1962 data):

| introibo                          | Bosco                                              |
| --------------------------------- | -------------------------------------------------- |
| `white` + rankOrdinal 1 (Class I) | **gold** — Bosco lifts the greatest feasts to gold |
| `violet` + roseAllowed            | **rose** — Gaudete / Laetare                       |
| otherwise `base`                  | 1:1 → green / violet / white / red / black         |

**Season** — introibo season code → Bosco display label via a small table (insulates Bosco from
introibo's still-open season vocabulary, their #90); unknown codes fall back to a capitalised form:

`advent → Advent`, `christmastide → Christmastide`, `epiphany → Time after Epiphany`,
`septuagesima → Septuagesima`, `lent → Lent`, `passiontide → Passiontide`,
`eastertide → Paschaltide`, `pentecost → Time after Pentecost`.

**Feast name** — the reader labels the day `feast ?? "Feria — {season}"`, so:

- `kind === 'feria'` → English name **only if mapped** (Ash Wednesday, Holy Week, the Ember & Rogation
  days …), else `null` → the reader renders `"Feria — {season}"`. The `names.ts` map therefore doubles
  as the allowlist of which ferias are distinctive enough to name.
- any other kind (Sunday, feast, octave, vigil) → English if mapped, else fall back to the **Latin**
  `names.la`.

## English names & the Library↔calendar join (`names.ts`)

`names.ts` maps ObservanceId → kid-friendly English. Seeded with the **entire temporal cycle** (every
Sunday + the great movable feasts) and the **35 major Class I & II sanctoral feasts** (plus Bosco's
patron, St John Bosco). Minor sanctoral saints (~130/yr) stay in Latin until an English name — and,
later, a Library **Faith** article — is authored for that ObservanceId. Because a saint article will
map to the _same_ ObservanceId, `names.ts` is the join between the Library and the calendar.

## Coupling & maintenance

introibo is pre-1.0 (season vocabulary still open). Mitigations:

- The season table + Latin fallback mean an unknown code or id **degrades gracefully**, never crashes.
- The exact upstream `dataVersion` for each snapshot is recorded in `calendar.meta.json`; refreshes are
  deliberate, not automatic.
- Vendored range is **2024–2032** (3288 days). Extend with `npm run refresh:calendar START END` and
  commit the result. (`calendar.json` is bundled via a static import; a very wide range trades bundle
  size for runway — revisit lazy-loading if it grows.)

## Verification

`src/lib/calendar/calendar.test.ts` asserts the transform against known days (St John Bosco → white;
Christmas & Easter → gold; Gaudete/Laetare → rose; Septuagesima & Ash Wednesday → violet; Good Friday →
black; Pentecost → red; an unnamed feria → `"Feria — {season}"`; out-of-range → `null`) and a
whole-dataset colour invariant. Runs in CI via `npm test`.
