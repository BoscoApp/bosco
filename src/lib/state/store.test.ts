import { describe, it, expect, afterEach, vi } from 'vitest';
import { STATE_KEY, STATE_VERSION, DEFAULTS } from './schema';
import { migrate } from './migrations';
import { load, persist } from './persistence';

// Minimal in-memory localStorage stand-in for the node test project.
function makeStorage(seed: Record<string, string> = {}) {
	const map = new Map(Object.entries(seed));
	return {
		getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
		setItem: (k: string, v: string) => void map.set(k, v),
		removeItem: (k: string) => void map.delete(k),
		clear: () => map.clear(),
		key: (i: number) => [...map.keys()][i] ?? null,
		get length() {
			return map.size;
		}
	} as Storage;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('migrate', () => {
	it('stamps the current version and fills missing fields with defaults', () => {
		const result = migrate({ version: 0, data: { tier: 'scholar' } as never });
		expect(result.version).toBe(STATE_VERSION);
		expect(result.data.tier).toBe('scholar');
		expect(result.data.theme).toBe(DEFAULTS.theme);
		expect(result.data.muted).toBe(DEFAULTS.muted);
	});

	it('preserves reserved/unknown keys (never nukes future data like a card album)', () => {
		const result = migrate({
			version: 0,
			data: { tier: 'explorer', cardAlbum: ['red-fox'] } as never
		});
		expect((result.data as unknown as Record<string, unknown>).cardAlbum).toEqual(['red-fox']);
	});
});

describe('load', () => {
	it('returns defaults when nothing is stored', () => {
		vi.stubGlobal('localStorage', makeStorage());
		expect(load()).toEqual(DEFAULTS);
	});

	it('returns defaults (never throws) on corrupt data', () => {
		vi.stubGlobal('localStorage', makeStorage({ [STATE_KEY]: '{not valid json' }));
		expect(load()).toEqual(DEFAULTS);
	});

	it('returns defaults off-device (no localStorage)', () => {
		expect(load()).toEqual(DEFAULTS);
	});

	it('round-trips through persist and load', () => {
		vi.stubGlobal('localStorage', makeStorage());
		persist({ tier: 'seedling', theme: 'meadow', muted: true, patronSaint: 'John Bosco' });
		expect(load()).toEqual({
			tier: 'seedling',
			theme: 'meadow',
			muted: true,
			patronSaint: 'John Bosco'
		});
	});

	it('migrates an older stored envelope on load', () => {
		vi.stubGlobal(
			'localStorage',
			makeStorage({ [STATE_KEY]: JSON.stringify({ version: 0, data: { tier: 'scholar' } }) })
		);
		const loaded = load();
		expect(loaded.tier).toBe('scholar');
		expect(loaded.theme).toBe(DEFAULTS.theme);
	});
});

describe('persist', () => {
	it('no-ops off-device without throwing', () => {
		expect(() => persist(DEFAULTS)).not.toThrow();
	});
});
