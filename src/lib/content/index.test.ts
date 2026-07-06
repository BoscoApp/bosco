import { describe, it, expect } from 'vitest';
import { topics, getTopic, topicsByCategory } from './index';

// Vitest runs the content plugin in preview mode (command === 'serve'), so ALL topics —
// including non-approved ones — are present here. Production exclusion of pending topics is
// proven separately, against the real build, by scripts/check-content-gate.mjs.

describe('content loader (preview mode)', () => {
	it('loads the dummy topics', () => {
		expect(topics.length).toBeGreaterThanOrEqual(3);
	});

	it('resolves an approved topic with tier loaders', () => {
		const fox = getTopic('creatures', 'red-fox');
		expect(fox?.title).toBe('The Red Fox');
		expect(fox?.tiers).toEqual([1, 2, 3]);
		expect(typeof fox?.loaders[2]).toBe('function');
	});

	it('includes the pending topic in preview (it is gated out only in production)', () => {
		expect(getTopic('creatures', 'basilisk-draft')?.review_status).toBe('pending');
	});

	it('filters by category', () => {
		const creatures = topicsByCategory('creatures');
		expect(creatures.every((t) => t.category === 'creatures')).toBe(true);
		expect(creatures.some((t) => t.slug === 'red-fox')).toBe(true);
	});
});
