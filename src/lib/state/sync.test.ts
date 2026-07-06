import { describe, it, expect } from 'vitest';
import { NoopSyncAdapter, mergeRecords, lastWriteWins } from './sync';
import type { SyncRecord } from './types';

const rec = (id: string, updatedAt: number, data: unknown = {}): SyncRecord => ({
	id,
	updatedAt,
	data
});

describe('mergeRecords (union + last-write-wins)', () => {
	it('unions by id, keeping the newest version', () => {
		const merged = mergeRecords([rec('a', 1), rec('b', 5)], [rec('a', 3), rec('c', 2)]).sort(
			(x, y) => x.id.localeCompare(y.id)
		);
		expect(merged.map((r) => r.id)).toEqual(['a', 'b', 'c']);
		expect(merged.find((r) => r.id === 'a')?.updatedAt).toBe(3);
		expect(merged.find((r) => r.id === 'b')?.updatedAt).toBe(5);
	});

	it('never drops a record present on only one side', () => {
		expect(mergeRecords([rec('x', 1)], [])).toHaveLength(1);
		expect(mergeRecords([], [rec('y', 1)])).toHaveLength(1);
	});
});

describe('lastWriteWins', () => {
	it('keeps the later timestamped value', () => {
		expect(lastWriteWins({ value: 'old', at: 1 }, { value: 'new', at: 2 })).toBe('new');
		expect(lastWriteWins({ value: 'keep', at: 5 }, { value: 'stale', at: 2 })).toBe('keep');
	});
});

describe('NoopSyncAdapter', () => {
	it('pushes nothing and pulls nothing', async () => {
		const adapter = new NoopSyncAdapter();
		expect(adapter.name).toBe('none');
		await expect(adapter.push({ since: 0, records: [] })).resolves.toBeUndefined();
		expect(await adapter.pull(7)).toEqual({ since: 7, records: [] });
	});
});
