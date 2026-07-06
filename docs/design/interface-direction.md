# v0.2.0 Interface direction — **The Bosco Desktop** (LOCKED)

The interface for Bosco is an **interactive retro "computer desktop"** — a warm, original blend of
1990s desktop operating systems (not a clone of any one of them). The child arrives at a desktop with
the six destinations as app icons, opens each in a draggable window, and the whole thing is tinted by
the day's liturgical colour. This direction was chosen over four alternatives (GeoCities homepage,
Windows-95, illuminated-manuscript, plain Classic-Mac) across several rounds of mockups.

**Reference mockup:** [`desktop-mockup.html`](desktop-mockup.html) in this folder — a fully
self-contained, working HTML prototype (open it in a browser). Also published as an Artifact for
review. It is a **prototype**, not production code: the real thing is built in SvelteKit against the
Core primitives below.

## The concept

A **desktop metaphor**, de-Apple'd into a generic-retro look we own outright:

- **Menu bar** (trimmed): a **Home** button (a house icon — _not_ an Apple logo) · **Chapel** ·
  **Library** · **Settings** · **Help**, then on the right a **profile chip** (avatar + name) and a
  **liturgical-season clock** (a coloured dot + the season, e.g. "● Time after Pentecost").
- **Desktop wallpaper follows the calendar** — the whole background is the day's liturgical colour
  (`data-lit`). Green in Time after Pentecost, violet in Advent/Lent, white on feasts, etc.
- **Desktop app icons** — the six destinations as clickable icons on the desktop, in the locked
  **"Colour" icon set**: Library = blue book + red ribbon · Field Guide = green frame + gold sun ·
  Chapel = violet church · Art Studio = red palette · Arcade = gold cabinet · Typing = teal keyboard.
- **Windows** — every destination opens in its own window. Windows are **draggable** by the title bar;
  controls are **top-right**: **−** minimizes to a **bottom taskbar**, **□** maximizes, **×** closes.
  `Esc` closes the focused window. Open windows collect as tabs in the taskbar.
- **Home window** = the welcome "box": masthead (Bosco / bosco.kids / tagline / today's-colour pill) ·
  a bulletin marquee · the **six doors** · a **Day-of-the-Day** panel (saint + a verse) · a footer
  (visitor counter, an **About Bosco** link).
- **Settings window** = **Reading level** (Seedling 4–6 / Explorer 7–9 / Scholar 10–13) ·
  **Church colours** (tap to preview the wallpaper in another colour; today's is marked) ·
  **Sounds** on/off · **Look** (Clubhouse now; Meadow later). Reading level lives _here_, not on Home.
- **"Who's this?" first-run** = a profile picker + **avatar generator** (a colour + a Christian
  emblem: star, fish/ichthys, dove, sun, lamb, heart; "Shuffle" to spin). Tracked as
  [issue #70](https://github.com/BoscoApp/bosco/issues/70).
- **About Bosco window** — a warm, parent-facing trust panel (where the words come from, verbatim
  doctrine, "everything stays on this computer"). Reachable from Help and the Home footer.
- **Gentle sounds** — soft chimes on window open/close, **synthesized with the Web Audio API** (no
  audio files — stays fully offline), gated behind the Sounds preference.

## Aesthetic

Platinum/paper window chrome + the colourful app-icon set + warm, inviting copy. Calm and
navigable (a 7-year-old test-drove it and found it easy), never busy. **Sacred content is treated
with dignity** — the Chapel and saints are reverent; the play is everywhere else.

## Intellectual-property posture (important — not legal advice)

A GUI "look and feel" (desktop, windows, menu bar, icons-as-launchers) is **not copyrightable**
(_Apple v. Microsoft_, 9th Cir. 1994). We stay clearly clear of what _is_ protected:

- **No Apple trademarks or logos** — a home icon replaces the Apple mark; nothing is named "Mac",
  "Finder", etc. Keep any "System 7" reference to internal codenames only.
- **All-original graphics** — every icon is our own SVG; we never ship Apple's bitmaps or patterns.
- **Our own fonts** — bundle Atkinson Hyperlegible (body) + a retro display face (e.g. Press Start
  2P), never Apple's font files. (The mockup's `Verdana/Geneva/system` stack is only a fallback.)
- **A stylized blend, not a clone** — top-right `− □ ×` controls make it read as generic-retro.

Before the public launch (v1.0.0), a brief IP-lawyer review is cheap insurance — mostly on the
**name/branding**, not the desktop metaphor.

## How this maps to the v0.2.0 build (SvelteKit, against Core)

The prototype is HTML/CSS/JS; production reuses the Core primitives already shipped in v0.1.0:

- **Three token axes on `<html>`:** `data-theme` (clubhouse) · `data-lit` (from the calendar) ·
  `data-tier` (from Settings). The mockup already models `data-tier` and a `--lit` variable.
- **Wallpaper** reads `colourFor(today)` from **`$lib/calendar`** (the vendored `calendar.json`) — the
  mockup's embedded Easter/season calculator is only a stand-in.
- **Reading level, Sounds, active profile, theme** persist through **`$lib/state`** prefs.
- **Profiles + the avatar generator** use the `$lib/state` profiles model (issue #70).
- **The window manager, taskbar, desktop, and menu bar** are the **Portal shell** (the v0.2.0
  "Portal shell & retro chrome" epic). Keep it keyboard-accessible, reduced-motion-aware, responsive
  to ~380px, and **fully offline** (the mockup already honors zero-external-network).
- **Rooms are placeholders** here; real destination content/UX arrives from v0.3.0 onward.

Everything above is the agreed target. Build v0.2.0 to this.
