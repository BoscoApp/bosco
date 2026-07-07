import { describe, it, expect } from 'vitest';
import { topicFrontmatterSchema, isPublished, pickDefaultTier } from './schema';

const valid = {
	title: 'The Red Fox',
	category: 'creatures',
	summary: 'A clever little wild dog.',
	tiers: [1, 2, 3],
	review_status: 'approved'
};

describe('topicFrontmatterSchema', () => {
	it('accepts valid frontmatter and defaults arrays', () => {
		const parsed = topicFrontmatterSchema.parse(valid);
		expect(parsed.title).toBe('The Red Fox');
		expect(parsed.sources).toEqual([]);
		expect(parsed.media).toEqual([]);
		expect(parsed.archives).toEqual([]);
		expect(parsed.default_tier).toBeUndefined();
	});

	it('accepts an optional default_tier and rejects an out-of-range one', () => {
		expect(topicFrontmatterSchema.parse({ ...valid, default_tier: 1 }).default_tier).toBe(1);
		expect(() => topicFrontmatterSchema.parse({ ...valid, default_tier: 4 })).toThrow();
	});

	it('rejects an unknown category', () => {
		expect(() => topicFrontmatterSchema.parse({ ...valid, category: 'sports' })).toThrow();
	});

	it('rejects an empty tiers list', () => {
		expect(() => topicFrontmatterSchema.parse({ ...valid, tiers: [] })).toThrow();
	});

	it('rejects a missing title', () => {
		const { title: _title, ...noTitle } = valid;
		expect(() => topicFrontmatterSchema.parse(noTitle)).toThrow();
	});

	it('rejects an invalid review_status', () => {
		expect(() => topicFrontmatterSchema.parse({ ...valid, review_status: 'shipit' })).toThrow();
	});
});

describe('isPublished (the doctrine gate)', () => {
	it('always publishes approved topics', () => {
		expect(isPublished('approved', { preview: false })).toBe(true);
		expect(isPublished('approved', { preview: true })).toBe(true);
	});

	it('excludes pending/draft from production, includes them in preview', () => {
		expect(isPublished('pending', { preview: false })).toBe(false);
		expect(isPublished('draft', { preview: false })).toBe(false);
		expect(isPublished('pending', { preview: true })).toBe(true);
		expect(isPublished('draft', { preview: true })).toBe(true);
	});
});

describe('pickDefaultTier', () => {
	it('honours a declared preference', () => {
		expect(pickDefaultTier([1, 2, 3], 1)).toBe(1);
		expect(pickDefaultTier([1, 2, 3], 3)).toBe(3);
	});

	it('defaults to Explorer (2) when no preference is given', () => {
		expect(pickDefaultTier([1, 2, 3])).toBe(2);
	});

	it('clamps to the nearest declared tier, ties going lower', () => {
		expect(pickDefaultTier([1, 3], 2)).toBe(1); // equidistant → lower
		expect(pickDefaultTier([3], 2)).toBe(3);
		expect(pickDefaultTier([1], 3)).toBe(1);
	});
});
