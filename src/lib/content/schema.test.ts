import { describe, it, expect } from 'vitest';
import { frontmatterSchema, CATEGORIES, CATEGORY_LABEL } from './schema';

const base = {
	topic: 'red-fox',
	title: 'The Red Fox',
	category: 'creatures',
	tiers: ['1']
};

describe('frontmatterSchema — related cross-links', () => {
	it('defaults `related` to [] when omitted', () => {
		const parsed = frontmatterSchema.safeParse(base);
		expect(parsed.success).toBe(true);
		if (parsed.success) expect(parsed.data.related).toEqual([]);
	});

	it('accepts a `related` array of {category, slug}', () => {
		const parsed = frontmatterSchema.safeParse({
			...base,
			related: [{ category: 'faith', slug: 'saint-john-bosco' }]
		});
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.related).toEqual([{ category: 'faith', slug: 'saint-john-bosco' }]);
		}
	});

	it('rejects a `related` entry with an unknown category', () => {
		const parsed = frontmatterSchema.safeParse({
			...base,
			related: [{ category: 'nonsense', slug: 'x' }]
		});
		expect(parsed.success).toBe(false);
	});
});

describe('frontmatterSchema — observanceId (calendar join)', () => {
	it('is optional (undefined when omitted)', () => {
		const parsed = frontmatterSchema.safeParse(base);
		expect(parsed.success).toBe(true);
		if (parsed.success) expect(parsed.data.observanceId).toBeUndefined();
	});

	it('accepts an ObservanceId string', () => {
		const parsed = frontmatterSchema.safeParse({
			...base,
			observanceId: 'roman:sanctorale:ioannes-bosco'
		});
		expect(parsed.success).toBe(true);
		if (parsed.success) expect(parsed.data.observanceId).toBe('roman:sanctorale:ioannes-bosco');
	});
});

describe('CATEGORY_LABEL', () => {
	it('has a non-empty label for every category', () => {
		for (const category of CATEGORIES) {
			expect(CATEGORY_LABEL[category]).toBeTruthy();
		}
	});
});
