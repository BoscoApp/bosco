import {
	MemoryKeyValueBackend,
	MemoryRecordBackend,
	type KeyValueBackend,
	type RecordBackend
} from './backend';
import { NoopSyncAdapter, mergeRecords } from './sync';
import { migrate } from './migrations';
import {
	SCHEMA_VERSION,
	type BackupFile,
	type ChangeSet,
	type PendingRecord,
	type PersistedState,
	type Prefs,
	type Profile,
	type ProfileAvatar,
	type SyncAdapter,
	type SyncRecord
} from './types';

const STATE_KEY = 'bosco:state';

export interface StoreOptions {
	kv?: KeyValueBackend;
	records?: RecordBackend;
	adapter?: SyncAdapter;
	now?: () => number;
	newId?: () => string;
}

function safeJson(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
}

/**
 * The single boundary features touch for persistence. Prefs + profiles live in a synchronous
 * key/value backend (localStorage); per-profile collections live in an async record backend
 * (IndexedDB). Change tracking is timestamp-based; sync is opt-in via a {@link SyncAdapter}
 * (default no-op). Backups are the durable copy when there is no sync.
 */
export class BoscoStore {
	private readonly kv: KeyValueBackend;
	private readonly records: RecordBackend;
	private readonly adapter: SyncAdapter;
	private readonly now: () => number;
	private readonly newId: () => string;
	private state: PersistedState;

	constructor(opts: StoreOptions = {}) {
		this.kv = opts.kv ?? new MemoryKeyValueBackend();
		this.records = opts.records ?? new MemoryRecordBackend();
		this.adapter = opts.adapter ?? new NoopSyncAdapter();
		this.now = opts.now ?? (() => Date.now());
		this.newId = opts.newId ?? (() => globalThis.crypto.randomUUID());
		this.state = migrate(this.readEnvelope());
	}

	private readEnvelope(): unknown {
		const raw = this.kv.get(STATE_KEY);
		return raw ? safeJson(raw) : null;
	}
	private save(): void {
		this.kv.set(STATE_KEY, JSON.stringify(this.state));
	}

	// --- Preferences ---------------------------------------------------------

	getPrefs(): Prefs {
		return { ...this.state.prefs };
	}
	setPref<K extends keyof Prefs>(key: K, value: Prefs[K]): void {
		this.state.prefs[key] = value;
		this.save();
	}

	// --- Profiles ------------------------------------------------------------

	listProfiles(): Profile[] {
		return [...this.state.profiles];
	}
	get activeProfile(): Profile | null {
		return this.state.profiles.find((p) => p.id === this.state.prefs.activeProfileId) ?? null;
	}
	createProfile(name: string, avatar?: ProfileAvatar): Profile {
		const profile: Profile = { id: this.newId(), name, createdAt: this.now(), avatar };
		this.state.profiles.push(profile);
		if (!this.state.prefs.activeProfileId) this.state.prefs.activeProfileId = profile.id;
		this.save();
		return profile;
	}
	renameProfile(id: string, name: string): void {
		const p = this.state.profiles.find((x) => x.id === id);
		if (p) {
			p.name = name;
			this.save();
		}
	}
	setProfileAvatar(id: string, avatar: ProfileAvatar): void {
		const p = this.state.profiles.find((x) => x.id === id);
		if (p) {
			p.avatar = avatar;
			this.save();
		}
	}
	setActiveProfile(id: string): void {
		if (this.state.profiles.some((p) => p.id === id)) {
			this.state.prefs.activeProfileId = id;
			this.save();
		}
	}
	async deleteProfile(id: string): Promise<void> {
		this.state.profiles = this.state.profiles.filter((p) => p.id !== id);
		if (this.state.prefs.activeProfileId === id) {
			this.state.prefs.activeProfileId = this.state.profiles[0]?.id ?? null;
		}
		for (const name of await this.records.listCollections()) {
			if (name.startsWith(`${id}:`)) await this.records.clear(name);
		}
		this.save();
	}

	// --- Collections (scoped to the active profile) --------------------------

	private collectionKey(collection: string): string {
		const pid = this.state.prefs.activeProfileId;
		if (!pid) throw new Error('No active profile; create or select one before writing records.');
		return `${pid}:${collection}`;
	}
	async addRecord<T>(collection: string, data: T, id?: string): Promise<SyncRecord<T>> {
		const record: SyncRecord<T> = { id: id ?? this.newId(), updatedAt: this.now(), data };
		await this.records.put(this.collectionKey(collection), record);
		return record;
	}
	async getRecords<T>(collection: string): Promise<SyncRecord<T>[]> {
		return (await this.records.getAll(this.collectionKey(collection))) as SyncRecord<T>[];
	}

	// --- Change tracking + sync ---------------------------------------------

	/** Records changed since the last successful sync — what a push would send. */
	async pendingChanges(): Promise<ChangeSet> {
		const since = this.state.syncCursor;
		const records: PendingRecord[] = [];
		for (const collection of await this.records.listCollections()) {
			for (const record of await this.records.getAll(collection)) {
				if (record.updatedAt > since) records.push({ collection, record });
			}
		}
		return { since, records };
	}

	/**
	 * Push pending changes, pull remote changes, and union-merge them in. With the default
	 * NoopSyncAdapter this only advances the cursor — a safe no-op. Real conflict handling is
	 * fleshed out in the v1.1.0 sync spike.
	 */
	async sync(): Promise<void> {
		const changes = await this.pendingChanges();
		await this.adapter.push(changes);

		const pulled = await this.adapter.pull(this.state.syncCursor);
		const byCollection = new Map<string, SyncRecord[]>();
		for (const { collection, record } of pulled.records) {
			const arr = byCollection.get(collection) ?? [];
			arr.push(record);
			byCollection.set(collection, arr);
		}
		let cursor = this.now();
		for (const [collection, incoming] of byCollection) {
			const merged = mergeRecords(await this.records.getAll(collection), incoming);
			await this.records.bulkPut(collection, merged);
			for (const r of merged) cursor = Math.max(cursor, r.updatedAt);
		}
		this.state.syncCursor = cursor;
		this.save();
	}

	// --- Backup (export / import) -------------------------------------------

	async export(): Promise<BackupFile> {
		const collections: Record<string, SyncRecord[]> = {};
		for (const name of await this.records.listCollections()) {
			collections[name] = await this.records.getAll(name);
		}
		return {
			kind: 'bosco-backup',
			version: SCHEMA_VERSION,
			exportedAt: this.now(),
			state: JSON.parse(JSON.stringify(this.state)) as PersistedState,
			collections
		};
	}

	/** Non-destructive import: profiles and collections union-merge; nothing local is dropped. */
	async import(backup: BackupFile): Promise<void> {
		const migrated = migrate(backup.state);

		const byId = new Map(this.state.profiles.map((p) => [p.id, p]));
		for (const p of migrated.profiles) if (!byId.has(p.id)) byId.set(p.id, p);
		this.state.profiles = [...byId.values()];
		if (!this.state.prefs.activeProfileId) {
			this.state.prefs.activeProfileId =
				migrated.prefs.activeProfileId ?? this.state.profiles[0]?.id ?? null;
		}

		for (const [name, incoming] of Object.entries(backup.collections ?? {})) {
			const merged = mergeRecords(await this.records.getAll(name), incoming);
			await this.records.bulkPut(name, merged);
		}
		this.save();
	}
}
