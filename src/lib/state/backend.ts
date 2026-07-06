import type { SyncRecord } from './types';

/**
 * Storage seams. Small hot data (prefs, profiles) uses a synchronous {@link KeyValueBackend}
 * (localStorage in the browser); large per-profile collections use an async {@link RecordBackend}
 * (IndexedDB in the browser). Tests inject the in-memory fakes.
 */

export interface KeyValueBackend {
	get(key: string): string | null;
	set(key: string, value: string): void;
	remove(key: string): void;
}

export class MemoryKeyValueBackend implements KeyValueBackend {
	private map = new Map<string, string>();
	get(key: string): string | null {
		return this.map.has(key) ? (this.map.get(key) as string) : null;
	}
	set(key: string, value: string): void {
		this.map.set(key, value);
	}
	remove(key: string): void {
		this.map.delete(key);
	}
}

/** localStorage-backed key/value. Only construct in a browser context. */
export function browserKeyValueBackend(): KeyValueBackend {
	const ls = globalThis.localStorage;
	return {
		get: (k) => ls.getItem(k),
		set: (k, v) => ls.setItem(k, v),
		remove: (k) => ls.removeItem(k)
	};
}

export interface RecordBackend {
	getAll(collection: string): Promise<SyncRecord[]>;
	put(collection: string, record: SyncRecord): Promise<void>;
	bulkPut(collection: string, records: SyncRecord[]): Promise<void>;
	listCollections(): Promise<string[]>;
	clear(collection: string): Promise<void>;
}

export class MemoryRecordBackend implements RecordBackend {
	private data = new Map<string, Map<string, SyncRecord>>();
	private col(name: string): Map<string, SyncRecord> {
		let c = this.data.get(name);
		if (!c) {
			c = new Map();
			this.data.set(name, c);
		}
		return c;
	}
	async getAll(collection: string): Promise<SyncRecord[]> {
		return [...this.col(collection).values()];
	}
	async put(collection: string, record: SyncRecord): Promise<void> {
		this.col(collection).set(record.id, record);
	}
	async bulkPut(collection: string, records: SyncRecord[]): Promise<void> {
		for (const r of records) this.col(collection).set(r.id, r);
	}
	async listCollections(): Promise<string[]> {
		return [...this.data.keys()].filter((k) => this.col(k).size > 0);
	}
	async clear(collection: string): Promise<void> {
		this.data.delete(collection);
	}
}

/**
 * IndexedDB-backed record store. A single object store keyed by `${collection}::${id}`, with an
 * index on `collection` for range queries. Thin on purpose — the album/art/progress collections
 * that exercise it land from v0.4.0 onward.
 */
export class IndexedDbRecordBackend implements RecordBackend {
	private dbp: Promise<IDBDatabase> | null = null;
	private readonly store = 'records';

	constructor(
		private readonly dbName = 'bosco',
		private readonly idb: IDBFactory = globalThis.indexedDB
	) {}

	private open(): Promise<IDBDatabase> {
		if (this.dbp) return this.dbp;
		this.dbp = new Promise((resolve, reject) => {
			const req = this.idb.open(this.dbName, 1);
			req.onupgradeneeded = () => {
				const db = req.result;
				if (!db.objectStoreNames.contains(this.store)) {
					const os = db.createObjectStore(this.store, { keyPath: 'key' });
					os.createIndex('collection', 'collection', { unique: false });
				}
			};
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});
		return this.dbp;
	}

	private async tx(mode: IDBTransactionMode): Promise<IDBObjectStore> {
		const db = await this.open();
		return db.transaction(this.store, mode).objectStore(this.store);
	}

	private static done<T>(req: IDBRequest<T>): Promise<T> {
		return new Promise((resolve, reject) => {
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});
	}

	async getAll(collection: string): Promise<SyncRecord[]> {
		const os = await this.tx('readonly');
		const rows = await IndexedDbRecordBackend.done(
			os.index('collection').getAll(IDBKeyRange.only(collection))
		);
		return (rows as Array<{ record: SyncRecord }>).map((r) => r.record);
	}

	async put(collection: string, record: SyncRecord): Promise<void> {
		const os = await this.tx('readwrite');
		await IndexedDbRecordBackend.done(
			os.put({ key: `${collection}::${record.id}`, collection, record })
		);
	}

	async bulkPut(collection: string, records: SyncRecord[]): Promise<void> {
		const os = await this.tx('readwrite');
		await Promise.all(
			records.map((record) =>
				IndexedDbRecordBackend.done(
					os.put({ key: `${collection}::${record.id}`, collection, record })
				)
			)
		);
	}

	async listCollections(): Promise<string[]> {
		const os = await this.tx('readonly');
		const keys = (await IndexedDbRecordBackend.done(os.getAllKeys())) as string[];
		return [...new Set(keys.map((k) => k.split('::')[0]))];
	}

	async clear(collection: string): Promise<void> {
		const os = await this.tx('readwrite');
		const keys = (await IndexedDbRecordBackend.done(os.getAllKeys())) as string[];
		await Promise.all(
			keys
				.filter((k) => k.startsWith(`${collection}::`))
				.map((k) => IndexedDbRecordBackend.done(os.delete(k)))
		);
	}
}
