import { describe, it, expect } from 'vitest';
import {
	topicFrontmatterSchema,
	anatomySchema,
	isPublished,
	pickDefaultTier,
	validateCrossLinks,
	validateArchives,
	validateFieldGuide
} from './schema';

const valid = {
	title: 'The Red Fox',
	category: 'creatures',
	summary: 'A clever little wild dog.',
	tiers: [1, 2, 3],
	review_status: 'approved',
	habitat: ['woodland', 'farmland'],
	kind: 'mammal'
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

describe('Field Guide taxonomy (habitat / kind, creature-only)', () => {
	it('requires both habitat and kind on a creature', () => {
		const { habitat: _h, kind: _k, ...noTaxonomy } = valid;
		expect(() => topicFrontmatterSchema.parse(noTaxonomy)).toThrow();
		expect(() => topicFrontmatterSchema.parse({ ...valid, habitat: undefined })).toThrow();
		expect(() => topicFrontmatterSchema.parse({ ...valid, kind: undefined })).toThrow();
	});

	it('rejects an empty habitat list and unknown enum members', () => {
		expect(() => topicFrontmatterSchema.parse({ ...valid, habitat: [] })).toThrow();
		expect(() => topicFrontmatterSchema.parse({ ...valid, habitat: ['moon'] })).toThrow();
		expect(() => topicFrontmatterSchema.parse({ ...valid, kind: 'dragon' })).toThrow();
	});

	it('accepts a creature with a valid multi-habitat + kind', () => {
		const parsed = topicFrontmatterSchema.parse(valid);
		expect(parsed.habitat).toEqual(['woodland', 'farmland']);
		expect(parsed.kind).toBe('mammal');
	});

	it('forbids habitat/kind on a non-creature topic', () => {
		// A world topic still carrying taxonomy is rejected...
		expect(() => topicFrontmatterSchema.parse({ ...valid, category: 'world' })).toThrow();
		// ...but the same world topic without it parses clean.
		const { habitat: _h, kind: _k, ...worldClean } = { ...valid, category: 'world' };
		expect(() => topicFrontmatterSchema.parse(worldClean)).not.toThrow();
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

describe('anatomySchema (per-object shape)', () => {
	const hotspot = { id: 'ears', label: 'Ears', blurb: 'Big ears hear well.', x: 26, y: 20 };

	it('accepts a well-formed diagram with hotspots', () => {
		const parsed = anatomySchema.parse({ diagram: 'fox-anatomy', hotspots: [hotspot] });
		expect(parsed.diagram).toBe('fox-anatomy');
		expect(parsed.hotspots).toHaveLength(1);
		expect(parsed.hotspots[0].tier).toBeUndefined();
	});

	it('rejects an empty hotspot list, empty label/blurb/id, and out-of-range coords', () => {
		expect(() => anatomySchema.parse({ diagram: 'd', hotspots: [] })).toThrow();
		expect(() => anatomySchema.parse({ diagram: '', hotspots: [hotspot] })).toThrow();
		expect(() =>
			anatomySchema.parse({ diagram: 'd', hotspots: [{ ...hotspot, label: '' }] })
		).toThrow();
		expect(() =>
			anatomySchema.parse({ diagram: 'd', hotspots: [{ ...hotspot, blurb: '' }] })
		).toThrow();
		expect(() =>
			anatomySchema.parse({ diagram: 'd', hotspots: [{ ...hotspot, id: '' }] })
		).toThrow();
		expect(() =>
			anatomySchema.parse({ diagram: 'd', hotspots: [{ ...hotspot, x: 101 }] })
		).toThrow();
		expect(() =>
			anatomySchema.parse({ diagram: 'd', hotspots: [{ ...hotspot, y: -1 }] })
		).toThrow();
	});

	it('rejects a token-unsafe hotspot id (whitespace or uppercase would break the id / aria reference)', () => {
		expect(() =>
			anatomySchema.parse({ diagram: 'd', hotspots: [{ ...hotspot, id: 'brush tail' }] })
		).toThrow();
		expect(() =>
			anatomySchema.parse({ diagram: 'd', hotspots: [{ ...hotspot, id: 'Ears' }] })
		).toThrow();
	});

	it('is optional on a topic and forbidden nowhere by the base schema (creature-only lives in the validator)', () => {
		// The per-object schema does not couple anatomy to category; validateFieldGuide enforces that.
		expect(topicFrontmatterSchema.parse(valid).anatomy).toBeUndefined();
	});
});

describe('validateFieldGuide (build-time anatomy-diagram integrity)', () => {
	const media = [{ id: 'fox-anatomy', kind: 'diagram' }];
	const hotspots = [
		{ id: 'ears', label: 'Ears', blurb: 'Big ears.', x: 26, y: 20 },
		{ id: 'tail', label: 'Tail', blurb: 'A bushy brush.', x: 86, y: 56 }
	];
	const fox = {
		path: 'creatures/red-fox',
		category: 'creatures',
		media,
		anatomy: { diagram: 'fox-anatomy', hotspots }
	};

	it('passes for a topic with a resolving diagram and well-formed hotspots', () => {
		expect(() => validateFieldGuide([fox])).not.toThrow();
	});

	it('passes for topics with no anatomy at all', () => {
		expect(() =>
			validateFieldGuide([
				{ path: 'world/printing-press', category: 'world', media: [], anatomy: undefined }
			])
		).not.toThrow();
	});

	it('throws when a non-creature topic declares anatomy', () => {
		expect(() => validateFieldGuide([{ ...fox, path: 'world/press', category: 'world' }])).toThrow(
			/only valid on creatures/
		);
	});

	it('throws when anatomy.diagram resolves to no media[] entry on the topic (dangling)', () => {
		expect(() => validateFieldGuide([{ ...fox, media: [] }])).toThrow(/names no media\[\] entry/);
	});

	it('throws when the referenced media entry is not of kind "diagram"', () => {
		expect(() =>
			validateFieldGuide([{ ...fox, media: [{ id: 'fox-anatomy', kind: 'illustration' }] }])
		).toThrow(/kind "diagram"/);
	});

	it('throws on a duplicate hotspot id', () => {
		expect(() =>
			validateFieldGuide([
				{ ...fox, anatomy: { diagram: 'fox-anatomy', hotspots: [hotspots[0], hotspots[0]] } }
			])
		).toThrow(/repeats the anatomy hotspot id/);
	});

	it('throws on a token-unsafe hotspot id (self-contained: catches a bad id even bypassing the schema)', () => {
		// A mid-string space is truthy (a bare `.trim()` check would miss it) but must still fail — the id
		// becomes an aria-describedby IDREF, which is whitespace-separated.
		expect(() =>
			validateFieldGuide([
				{
					...fox,
					anatomy: { diagram: 'fox-anatomy', hotspots: [{ ...hotspots[0], id: 'brush tail' }] }
				}
			])
		).toThrow(/not token-safe/);
	});

	it('throws on an empty label or blurb (the accessible name / baked fact)', () => {
		expect(() =>
			validateFieldGuide([
				{ ...fox, anatomy: { diagram: 'fox-anatomy', hotspots: [{ ...hotspots[0], label: '  ' }] } }
			])
		).toThrow(/empty label/);
		expect(() =>
			validateFieldGuide([
				{ ...fox, anatomy: { diagram: 'fox-anatomy', hotspots: [{ ...hotspots[0], blurb: '' }] } }
			])
		).toThrow(/empty blurb/);
	});

	it('throws on out-of-range coordinates', () => {
		expect(() =>
			validateFieldGuide([
				{ ...fox, anatomy: { diagram: 'fox-anatomy', hotspots: [{ ...hotspots[0], x: 120 }] } }
			])
		).toThrow(/outside the 0–100 range/);
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
