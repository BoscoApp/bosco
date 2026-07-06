import { describe, it, expect } from 'vitest';
import { BoscoStore } from './store';
import { MemoryKeyValueBackend, MemoryRecordBackend } from './backend';

/** A store with deterministic clock + ids, over in-memory fakes. */
function makeStore(kv = new MemoryKeyValueBackend()) {
	let t = 1000;
	let n = 0;
	return new BoscoStore({
		kv,
		records: new MemoryRecordBackend(),
		now: () => ++t,
		newId: () => `id-${++n}`
	});
}

describe('profile avatars (v0.2.0)', () => {
	it('stores a chosen avatar on create and reads it back', () => {
		const store = makeStore();
		const p = store.createProfile('Rose', { color: 2, emblem: 3 });
		expect(p.avatar).toEqual({ color: 2, emblem: 3 });
		expect(store.listProfiles()[0].avatar).toEqual({ color: 2, emblem: 3 });
	});

	it('leaves the avatar undefined when none is chosen (backward compatible)', () => {
		const store = makeStore();
		const p = store.createProfile('Gus');
		expect(p.avatar).toBeUndefined();
	});

	it('updates an avatar and persists it across a reload', () => {
		const kv = new MemoryKeyValueBackend();
		const store = makeStore(kv);
		const p = store.createProfile('Rose', { color: 0, emblem: 0 });
		store.setProfileAvatar(p.id, { color: 5, emblem: 1 });

		const reloaded = new BoscoStore({ kv });
		expect(reloaded.listProfiles()[0].avatar).toEqual({ color: 5, emblem: 1 });
	});
});
