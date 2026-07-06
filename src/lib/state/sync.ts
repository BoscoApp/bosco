import type { ChangeSet, SyncAdapter, SyncRecord } from './types';

/**
 * The default sync adapter: no server, no network, nothing leaves the device. Bosco is fully
 * usable with this in place forever. Opt-in, parent-gated sync (v1.1.0) swaps in a real adapter.
 */
export class NoopSyncAdapter implements SyncAdapter {
	readonly name = 'none';
	async push(_changes: ChangeSet): Promise<void> {
		// intentionally does nothing
	}
	async pull(since: number): Promise<ChangeSet> {
		return { since, records: [] };
	}
}

/**
 * Union-merge two sets of records by id, keeping the newest (last-write-wins on `updatedAt`).
 * Append-only collections (album, mastery, high scores) merge losslessly this way: a record on
 * either side survives, and concurrent edits keep the later timestamp.
 */
export function mergeRecords(local: SyncRecord[], incoming: SyncRecord[]): SyncRecord[] {
	const byId = new Map<string, SyncRecord>();
	for (const r of local) byId.set(r.id, r);
	for (const r of incoming) {
		const cur = byId.get(r.id);
		if (!cur || r.updatedAt >= cur.updatedAt) byId.set(r.id, r);
	}
	return [...byId.values()];
}

/** Scalar last-write-wins for a single timestamped value (used for prefs). */
export function lastWriteWins<T>(a: { value: T; at: number }, b: { value: T; at: number }): T {
	return b.at >= a.at ? b.value : a.value;
}
