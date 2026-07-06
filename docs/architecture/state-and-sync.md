# State & sync

Bosco is **local-first**. Everything a child accumulates lives on the device by default; there are
no kid accounts and no server data. A parent may _opt in_ to cross-device sync later (v1.1.0), and
nothing about the default experience changes if they don't.

## The one boundary

Features import **`$lib/state`** and nothing else touches storage. That module (`src/lib/state/`)
owns the shapes, the persistence, the change tracking, and the sync seam.

```
feature code ── getStore() ──▶ BoscoStore ──▶ KeyValueBackend  (prefs, profiles)   → localStorage
                                          └──▶ RecordBackend    (album, art, …)     → IndexedDB
                                          └──▶ SyncAdapter       (default: none)     → v1.1.0
```

- **Prefs** (active profile, theme, tier, mute) are small and hot → a synchronous key/value backend
  (localStorage). Last-write-wins on sync.
- **Profiles** — named, one per sibling. No PII beyond a chosen name.
- **Collections** (card album, saved art, typing/arcade progress) are large and per-profile → an
  async record backend (IndexedDB). Append-only, so they **union-merge losslessly**.
- Tests inject in-memory fakes for both backends.

## Sync-ready from day one, sync off by default

The store tracks changes by timestamp (`updatedAt` vs a `syncCursor`) and exposes a `SyncAdapter`
seam. The default is `NoopSyncAdapter` — no server, no network. When opt-in sync ships (v1.1.0), a
real adapter (public instance **or** a self-hosted one) attaches here without any feature code
changing: monotonic collections union-merge, scalar prefs are last-write-wins, and the whole thing
is parent-initiated + consented (the COPPA posture).

## Durability

The browser can evict IndexedDB under storage pressure, so the **export/import backup file** (and,
later, opt-in sync) is the durable copy. The UI nudges parents to back up.

See [`../../src/lib/state/`](../../src/lib/state) for the implementation and its unit tests.
