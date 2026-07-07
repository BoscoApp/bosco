import { describe, it, expect } from 'vitest';
import { clampToOffered } from './tiers';

describe('clampToOffered', () => {
	it('keeps a tier the topic offers', () => {
		expect(clampToOffered([1, 2, 3], 1, 2)).toBe(1);
		expect(clampToOffered([1, 2, 3], 3, 2)).toBe(3);
	});

	it('falls back to the default for a tier the topic does NOT offer', () => {
		// A partial-tier topic (e.g. tiers [2]) with the reader's global level at Scholar (3) must
		// still render — it falls back to the topic's default tier, which always has a body.
		expect(clampToOffered([2], 3, 2)).toBe(2);
		expect(clampToOffered([2], 1, 2)).toBe(2);
		expect(clampToOffered([1, 2], 3, 2)).toBe(2);
	});
});
