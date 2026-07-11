/**
 * Local-first state — the ONLY module features import for persistence. Nothing else touches
 * storage. Opt-in sync (v1.1.0) attaches through the {@link SyncAdapter} seam without any feature
 * change. See docs/architecture/state-and-sync.md.
 */
export * from './types';
export * from './backend';
export * from './sync';
export * from './album';
export { migrate } from './migrations';
export { BoscoStore, type StoreOptions } from './store';

import { BoscoStore } from './store';
import {
	browserKeyValueBackend,
	IndexedDbRecordBackend,
	MemoryKeyValueBackend,
	MemoryRecordBackend
} from './backend';

let singleton: BoscoStore | null = null;

/**
 * The app-wide store. In the browser it persists to localStorage + IndexedDB; during
 * SSR/prerender (no storage APIs) it falls back to in-memory backends so imports never crash.
 */
export function getStore(): BoscoStore {
	if (singleton) return singleton;
	const isBrowser =
		typeof globalThis.localStorage !== 'undefined' && typeof globalThis.indexedDB !== 'undefined';
	singleton = isBrowser
		? new BoscoStore({ kv: browserKeyValueBackend(), records: new IndexedDbRecordBackend() })
		: new BoscoStore({ kv: new MemoryKeyValueBackend(), records: new MemoryRecordBackend() });
	return singleton;
}

/** Test-only: drop the cached singleton so the next getStore() rebuilds it. */
export function resetStoreForTests(): void {
	singleton = null;
}
