import { describe, it, expect } from 'vitest';
import { BoscoStore } from './store';
import { MemoryKeyValueBackend, MemoryRecordBackend } from './backend';
import { recordCard, hasCard, listCards, ALBUM_COLLECTION } from './album';

/** A store with a deterministic clock + ids over in-memory fakes (mirrors store.test.ts). */
function makeStore() {
	let t = 1000;
	let n = 0;
	return new BoscoStore({
		kv: new MemoryKeyValueBackend(),
		records: new MemoryRecordBackend(),
		now: () => ++t,
		newId: () => `id-${++n}`
	});
}

describe('album (records, not rewards)', () => {
	it('records a creature on read and lists it', async () => {
		const store = makeStore();
		store.createProfile('Rose');
		await recordCard(store, 'red-fox');
		expect(await hasCard(store, 'red-fox')).toBe(true);
		expect(await listCards(store)).toEqual(['red-fox']);
	});

	it('is idempotent — reading a creature twice records one card, timestamp frozen', async () => {
		const store = makeStore();
		store.createProfile('Rose');
		await recordCard(store, 'red-fox');
		const [before] = await store.getRecords(ALBUM_COLLECTION);
		await recordCard(store, 'red-fox');
		const cards = await store.getRecords(ALBUM_COLLECTION);
		expect(cards).toHaveLength(1);
		expect(cards[0].updatedAt).toBe(before.updatedAt);
	});

	it('is profile-scoped — each child keeps their own album', async () => {
		const store = makeStore();
		const rose = store.createProfile('Rose');
		const finn = store.createProfile('Finn');

		store.setActiveProfile(rose.id);
		await recordCard(store, 'red-fox');

		store.setActiveProfile(finn.id);
		expect(await listCards(store)).toEqual([]);
		await recordCard(store, 'badger');
		expect(await listCards(store)).toEqual(['badger']);

		store.setActiveProfile(rose.id);
		expect(await listCards(store)).toEqual(['red-fox']);
	});

	it('is safe with no active profile — records nothing, reads empty, never throws', async () => {
		const store = makeStore(); // no profile created
		await expect(recordCard(store, 'red-fox')).resolves.toBeUndefined();
		expect(await hasCard(store, 'red-fox')).toBe(false);
		expect(await listCards(store)).toEqual([]);
	});

	it('survives an export/import round-trip', async () => {
		const src = makeStore();
		src.createProfile('Rose');
		await recordCard(src, 'red-fox');
		const backup = await src.export();

		const dst = makeStore(); // fresh backends
		await dst.import(backup); // adopts Rose as the active profile
		expect(await listCards(dst)).toEqual(['red-fox']);
	});
});
