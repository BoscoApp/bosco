/**
 * Local-first state — shared types.
 *
 * Everything a child accumulates (prefs, profiles, the card album, saved art, progress) lives on
 * the device by default. This module defines the data shapes and the sync seam; nothing here
 * talks to a server. Opt-in, parent-gated sync (v1.1.0) bolts on via {@link SyncAdapter} without
 * any feature code changing.
 */

/** Bumped whenever the persisted envelope shape changes; drives the migration runner. */
export const SCHEMA_VERSION = 1;

export type Theme = 'clubhouse' | 'meadow';
export type Tier = 1 | 2 | 3;

/** Small, hot preferences — persisted in localStorage, last-write-wins on sync. */
export interface Prefs {
	activeProfileId: string | null;
	theme: Theme;
	tier: Tier;
	muted: boolean;
}

export const DEFAULT_PREFS: Prefs = {
	activeProfileId: null,
	theme: 'clubhouse',
	tier: 2,
	muted: false
};

/** A named per-device profile — one per sibling. No account, no PII beyond a chosen name. */
export interface Profile {
	id: string;
	name: string;
	createdAt: number;
}

/**
 * A record in an append-only collection (card album, saved art, high scores, mastery).
 * `updatedAt` powers change tracking; monotonic collections union-merge losslessly on sync.
 */
export interface SyncRecord<T = unknown> {
	id: string;
	updatedAt: number;
	deleted?: boolean;
	data: T;
}

/** A record tagged with the collection it belongs to (so a sync can route it). */
export interface PendingRecord {
	collection: string;
	record: SyncRecord;
}

/** A batch of changes since a cursor — the unit the sync adapter pushes and pulls. */
export interface ChangeSet {
	since: number;
	records: PendingRecord[];
}

/**
 * The sync seam. The default is {@link NoopSyncAdapter}; a real adapter (public instance or a
 * self-hosted one) is added at v1.1.0. Features never see this — they use the store.
 */
export interface SyncAdapter {
	readonly name: string;
	push(changes: ChangeSet): Promise<void>;
	pull(since: number): Promise<ChangeSet>;
}

/** The full local state, versioned for migration. Collections are keyed `${profileId}:${name}`. */
export interface PersistedState {
	version: number;
	prefs: Prefs;
	profiles: Profile[];
	/** Last successfully-synced timestamp; records newer than this are pending. */
	syncCursor: number;
}

/** A portable backup file for export/import (the durable copy when there is no sync). */
export interface BackupFile {
	kind: 'bosco-backup';
	version: number;
	exportedAt: number;
	state: PersistedState;
	collections: Record<string, SyncRecord[]>;
}
