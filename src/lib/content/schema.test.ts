import { describe, it, expect } from 'vitest';
import { topicFrontmatterSchema, isPublished } from './schema';

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
