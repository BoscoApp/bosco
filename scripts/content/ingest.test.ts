import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseSpec } from './lib/ingest.mjs';

const adaptedFixture = readFileSync('scripts/content/__fixtures__/specs/adapted.topic.md', 'utf8');
const verbatimFixture = readFileSync(
	'scripts/content/__fixtures__/specs/verbatim.topic.md',
	'utf8'
);

describe('parseSpec', () => {
	it('parses an adapted spec: source populated, verbatimTiers null', () => {
		const doc = parseSpec(adaptedFixture, { where: 'adapted' });
		expect(doc.kind).toBe('adapted');
		expect(doc.source).toContain('weasel family');
		expect(doc.verbatimTiers).toBeNull();
		expect(doc.meta.tiers).toEqual([1, 2, 3]);
	});

	it('parses a verbatim spec: a "## all" block maps to every declared tier', () => {
		const doc = parseSpec(verbatimFixture, { where: 'verbatim' });
		expect(doc.kind).toBe('verbatim');
		expect(doc.source).toBeNull();
		expect(Object.keys(doc.verbatimTiers!)).toEqual(['1', '2', '3']);
		expect(doc.verbatimTiers![1]).toBe(doc.verbatimTiers![3]);
		expect(doc.verbatimTiers![1]).toContain('Glory be');
	});

	it('rejects a spec with no content_kind (fail-closed)', () => {
		const spec = `---\ntitle: X\ncategory: creatures\nslug: x\nsummary: s\ntiers: [2]\n---\nbody`;
		expect(() => parseSpec(spec, { where: 'x' })).toThrow(/frontmatter/i);
	});

	it('rejects an adapted spec with an empty body', () => {
		// `world` (not `creatures`) so the spec passes frontmatter validation and reaches the
		// empty-body check — creatures would fail earlier on the required habitat/kind.
		const spec = `---\ncontent_kind: adapted\ntitle: X\ncategory: world\nslug: x\nsummary: s\ntiers: [2]\n---\n`;
		expect(() => parseSpec(spec, { where: 'x' })).toThrow(/empty body/i);
	});

	it('rejects a creature spec missing Field Guide taxonomy (habitat/kind required for creatures)', () => {
		const spec = `---\ncontent_kind: adapted\ntitle: X\ncategory: creatures\nslug: x\nsummary: s\ntiers: [2]\n---\nbody`;
		expect(() => parseSpec(spec, { where: 'x' })).toThrow(/habitat|kind|frontmatter/i);
	});

	it('rejects habitat/kind on a non-creature spec', () => {
		const spec = `---\ncontent_kind: adapted\ntitle: X\ncategory: world\nslug: x\nsummary: s\ntiers: [2]\nkind: mammal\n---\nbody`;
		expect(() => parseSpec(spec, { where: 'x' })).toThrow(/creature|frontmatter/i);
	});

	it('accepts a creature spec with valid habitat + kind', () => {
		const spec = `---\ncontent_kind: adapted\ntitle: X\ncategory: creatures\nslug: x\nsummary: s\ntiers: [2]\nhabitat: [woodland]\nkind: mammal\n---\nbody`;
		const doc = parseSpec(spec, { where: 'x' });
		expect(doc.meta.habitat).toEqual(['woodland']);
		expect(doc.meta.kind).toBe('mammal');
	});

	it('rejects a verbatim spec with free text outside a block', () => {
		const spec = `---\ncontent_kind: verbatim\ntitle: X\ncategory: faith\nslug: x\nsummary: s\ntiers: [2]\n---\nloose paraphrase\n## tier-2\nexact text`;
		expect(() => parseSpec(spec, { where: 'x' })).toThrow(/free\s+text|ONLY/i);
	});

	it('rejects a verbatim spec missing a block for a declared tier', () => {
		const spec = `---\ncontent_kind: verbatim\ntitle: X\ncategory: faith\nslug: x\nsummary: s\ntiers: [1, 2]\n---\n## tier-1\nonly tier one`;
		expect(() => parseSpec(spec, { where: 'x' })).toThrow(/missing "## tier-2"/);
	});

	it('rejects a per-tier block for an undeclared tier', () => {
		const spec = `---\ncontent_kind: verbatim\ntitle: X\ncategory: faith\nslug: x\nsummary: s\ntiers: [1]\n---\n## tier-1\none\n## tier-2\ntwo`;
		expect(() => parseSpec(spec, { where: 'x' })).toThrow(/not a declared tier/);
	});

	it('supports per-tier verbatim editions', () => {
		const spec = `---\ncontent_kind: verbatim\ntitle: X\ncategory: faith\nslug: x\nsummary: s\ntiers: [1, 2]\n---\n## tier-1\nsimple edition\n## tier-2\nfuller edition`;
		const doc = parseSpec(spec, { where: 'x' });
		expect(doc.verbatimTiers![1]).toBe('simple edition');
		expect(doc.verbatimTiers![2]).toBe('fuller edition');
	});

	it('rejects an out-of-range tier and a non-kebab slug', () => {
		const badTier = `---\ncontent_kind: adapted\ntitle: X\ncategory: creatures\nslug: x\nsummary: s\ntiers: [4]\n---\nbody`;
		expect(() => parseSpec(badTier, { where: 'x' })).toThrow();
		const badSlug = `---\ncontent_kind: adapted\ntitle: X\ncategory: creatures\nslug: Bad_Slug\nsummary: s\ntiers: [2]\n---\nbody`;
		expect(() => parseSpec(badSlug, { where: 'x' })).toThrow();
	});
});
