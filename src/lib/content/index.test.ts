import { describe, it, expect } from 'vitest';
import { topics, getTopic, topicsByCategory, eager, eagerBody } from './index';

// Vitest runs the content plugin in preview mode (command === 'serve'), so ALL topics —
// including non-approved ones — are present here. Production exclusion of pending topics is
// proven separately, against the real build, by scripts/check-content-gate.mjs.

describe('content loader (preview mode)', () => {
	it('loads the dummy topics', () => {
		expect(topics.length).toBeGreaterThanOrEqual(3);
	});

	it('resolves an approved topic with lazy loaders for the NON-default tiers only', () => {
		const fox = getTopic('creatures', 'red-fox');
		expect(fox?.title).toBe('The Red Fox');
		expect(fox?.tiers).toEqual([1, 2, 3]);
		expect(fox?.defaultTier).toBe(2); // no default_tier in frontmatter → Explorer
		// The default tier ships eagerly (see below), so it is intentionally absent from loaders;
		// the other two tiers load lazily on the client.
		expect(typeof fox?.loaders[1]).toBe('function');
		expect(typeof fox?.loaders[3]).toBe('function');
		expect(fox?.loaders[2]).toBeUndefined();
	});

	it('ships each topic’s default tier eagerly, keyed by path', () => {
		const fox = getTopic('creatures', 'red-fox')!;
		const body = eagerBody(fox.path);
		expect(body).toBe(eager[fox.path]);
		expect(body?.tier).toBe(fox.defaultTier);
		expect(body?.component).toBeTruthy();
	});

	it('includes the pending topic in preview (it is gated out only in production)', () => {
		expect(getTopic('creatures', 'basilisk-draft')?.review_status).toBe('pending');
	});

	it('carries curated See-also links through as `related` paths', () => {
		expect(getTopic('creatures', 'red-fox')?.related).toContain('world/printing-press');
		expect(getTopic('world', 'printing-press')?.related).toContain('creatures/red-fox');
	});

	it('filters by category', () => {
		const creatures = topicsByCategory('creatures');
		expect(creatures.every((t) => t.category === 'creatures')).toBe(true);
		expect(creatures.some((t) => t.slug === 'red-fox')).toBe(true);
	});
});
