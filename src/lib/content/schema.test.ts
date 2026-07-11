import { describe, it, expect } from 'vitest';
import {
	topicFrontmatterSchema,
	isPublished,
	pickDefaultTier,
	validateCrossLinks,
	validateArchives
} from './schema';

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

	it('defaults related to [] and accepts valid category/slug paths', () => {
		expect(topicFrontmatterSchema.parse(valid).related).toEqual([]);
		expect(
			topicFrontmatterSchema.parse({ ...valid, related: ['world/printing-press'] }).related
		).toEqual(['world/printing-press']);
	});

	it('rejects a malformed related path', () => {
		expect(() => topicFrontmatterSchema.parse({ ...valid, related: ['notapath'] })).toThrow();
		expect(() => topicFrontmatterSchema.parse({ ...valid, related: ['a/b/c'] })).toThrow();
	});
});

describe('validateCrossLinks (build-time See-also integrity)', () => {
	const fox = { path: 'creatures/red-fox', related: ['world/printing-press'] };
	const press = { path: 'world/printing-press', related: ['creatures/red-fox'] };

	it('passes when every related path resolves in the build', () => {
		expect(() => validateCrossLinks([fox, press])).not.toThrow();
	});

	it('passes for topics with no related links', () => {
		expect(() => validateCrossLinks([{ path: 'creatures/red-fox', related: [] }])).not.toThrow();
	});

	it('throws on a dangling / gated-out target (the approved → approved guarantee)', () => {
		// `press` is absent from the set, as it would be in a production build if it were unreviewed.
		expect(() => validateCrossLinks([fox])).toThrow(/no such topic ships/);
	});

	it('throws on a self-reference', () => {
		expect(() =>
			validateCrossLinks([{ path: 'creatures/red-fox', related: ['creatures/red-fox'] }])
		).toThrow(/itself/);
	});

	it('throws on a duplicate related entry', () => {
		expect(() =>
			validateCrossLinks([
				{ path: 'creatures/red-fox', related: ['world/printing-press', 'world/printing-press'] },
				press
			])
		).toThrow(/twice/);
	});
});

describe('validateArchives (build-time Archives manifest integrity)', () => {
	it('passes for topics with no archives', () => {
		expect(() => validateArchives([{ path: 'creatures/red-fox', archives: [] }])).not.toThrow();
	});

	it('passes when a topic lists distinct archive files', () => {
		expect(() =>
			validateArchives([
				{
					path: 'creatures/red-fox',
					archives: [{ file: 'brehm-1895.md' }, { file: 'seton-1909.md' }]
				}
			])
		).not.toThrow();
	});

	it('throws on a duplicate archive file within one topic', () => {
		expect(() =>
			validateArchives([
				{ path: 'creatures/red-fox', archives: [{ file: 'brehm.md' }, { file: 'brehm.md' }] }
			])
		).toThrow(/twice/);
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
