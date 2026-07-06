import { describe, it, expect } from 'vitest';
import { BoscoStore } from './store';
import { MemoryKeyValueBackend, MemoryRecordBackend } from './backend';
import { SCHEMA_VERSION } from './types';

/** A store with deterministic clock + ids, over in-memory fakes. */
function makeStore(kv = new MemoryKeyValueBackend(), records = new MemoryRecordBackend()) {
	let t = 1000;
	let n = 0;
	const store = new BoscoStore({ kv, records, now: () => ++t, newId: () => `id-${++n}` });
	return { store, kv, records };
}

describe('profiles + prefs', () => {
	it('creates a profile and makes the first one active', () => {
		const { store } = makeStore();
		const rose = store.createProfile('Rose');
		expect(store.listProfiles()).toHaveLength(1);
		expect(store.activeProfile?.id).toBe(rose.id);
		expect(store.getPrefs().activeProfileId).toBe(rose.id);
	});

	it('persists profiles and prefs across a reload from the same backend', () => {
		const kv = new MemoryKeyValueBackend();
		makeStore(kv).store.createProfile('Rose');
		const reloaded = new BoscoStore({ kv });
		reloaded.setPref('tier', 3);
		expect(reloaded.listProfiles().map((p) => p.name)).toEqual(['Rose']);
		expect(reloaded.getPrefs().tier).toBe(3);
	});

	it('deletes a profile and its collections', async () => {
		const { store, records } = makeStore();
		const rose = store.createProfile('Rose');
		await store.addRecord('album', { card: 'red-fox' });
		expect(await records.listCollections()).toContain(`${rose.id}:album`);
		await store.deleteProfile(rose.id);
		expect(store.listProfiles()).toHaveLength(0);
		expect(await records.listCollections()).not.toContain(`${rose.id}:album`);
	});
});

describe('change tracking + sync', () => {
	it('marks records pending until synced, then clears them', async () => {
		const { store } = makeStore();
		store.createProfile('Rose');
		await store.addRecord('album', { card: 'red-fox' });

		let pending = await store.pendingChanges();
		expect(pending.records).toHaveLength(1);
		expect(pending.records[0].collection).toContain(':album');

		await store.sync(); // NoopSyncAdapter — advances the cursor
		pending = await store.pendingChanges();
		expect(pending.records).toHaveLength(0);

		await store.addRecord('album', { card: 'printing-press' });
		pending = await store.pendingChanges();
		expect(pending.records).toHaveLength(1);
	});
});

describe('backup', () => {
	it('exports and imports non-destructively', async () => {
		const src = makeStore();
		src.store.createProfile('Rose');
		await src.store.addRecord('album', { card: 'red-fox' });
		const backup = await src.store.export();
		expect(backup.kind).toBe('bosco-backup');

		const dst = makeStore(); // fresh backends
		await dst.store.import(backup);
		expect(dst.store.listProfiles().map((p) => p.name)).toContain('Rose');
		const cards = await dst.store.getRecords<{ card: string }>('album');
		expect(cards.map((r) => r.data.card)).toContain('red-fox');
	});
});

describe('migration', () => {
	it('upgrades a legacy blob without a version, preserving data and filling defaults', () => {
		const kv = new MemoryKeyValueBackend();
		kv.set(
			'bosco:state',
			JSON.stringify({ prefs: { tier: 1 }, profiles: [{ id: 'x', name: 'Old', createdAt: 1 }] })
		);
		const store = new BoscoStore({ kv });
		expect(store.getPrefs().tier).toBe(1); // preserved
		expect(store.getPrefs().theme).toBe('clubhouse'); // default filled
		expect(store.listProfiles()).toHaveLength(1); // not dropped

		store.setPref('muted', true); // triggers a re-save
		expect(JSON.parse(kv.get('bosco:state') as string).version).toBe(SCHEMA_VERSION);
	});
});
