import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { IndexedDbRecordBackend, MemoryRecordBackend } from './backend';
import type { SyncRecord } from './types';

const rec = (id: string, updatedAt = 1): SyncRecord => ({ id, updatedAt, data: { id } });

let dbn = 0;
const fresh = () => new IndexedDbRecordBackend(`bosco-test-${++dbn}`);

describe('IndexedDbRecordBackend', () => {
	it('puts, bulk-puts, reads, lists, and clears a collection', async () => {
		const be = fresh();
		await be.put('id-1:album', rec('r1', 5));
		await be.bulkPut('id-1:album', [rec('r2', 6), rec('r3', 7)]);

		expect((await be.getAll('id-1:album')).map((r) => r.id).sort()).toEqual(['r1', 'r2', 'r3']);
		expect(await be.listCollections()).toContain('id-1:album');

		await be.clear('id-1:album');
		expect(await be.getAll('id-1:album')).toHaveLength(0);
	});

	it('keeps collections isolated', async () => {
		const be = fresh();
		await be.put('p:album', rec('a'));
		await be.put('p:art', rec('b'));
		expect((await be.getAll('p:album')).map((r) => r.id)).toEqual(['a']);
		expect((await be.getAll('p:art')).map((r) => r.id)).toEqual(['b']);
	});
});

describe('MemoryRecordBackend parity', () => {
	it('behaves like the IndexedDB backend for the store contract', async () => {
		const be = new MemoryRecordBackend();
		await be.bulkPut('c', [rec('a'), rec('b')]);
		expect((await be.getAll('c')).map((r) => r.id).sort()).toEqual(['a', 'b']);
		expect(await be.listCollections()).toEqual(['c']);
	});
});
