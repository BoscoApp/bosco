import { describe, it, expect } from 'vitest';
import { assertRelatedResolve, indexByObservance, topicForObservance, type Topic } from './index';
import type { Frontmatter } from './schema';

// Minimal Topic fakes — the checks under test only read slug, path, and a few frontmatter fields.
function fakeTopic(
	category: string,
	slug: string,
	related: { category: string; slug: string }[] = [],
	observanceId?: string
): Topic {
	return {
		slug,
		path: `${category}/${slug}`,
		frontmatter: { category, related, observanceId } as unknown as Frontmatter,
		tiers: {}
	};
}

describe('assertRelatedResolve', () => {
	it('passes when every related reference resolves within the set', () => {
		const fox = fakeTopic('creatures', 'red-fox', [
			{ category: 'faith', slug: 'saint-john-bosco' }
		]);
		const bosco = fakeTopic('faith', 'saint-john-bosco');
		expect(() => assertRelatedResolve([fox, bosco])).not.toThrow();
	});

	it('passes when there are no related references', () => {
		expect(() => assertRelatedResolve([fakeTopic('creatures', 'red-fox')])).not.toThrow();
	});

	it('throws a clear content error on a dangling reference', () => {
		const fox = fakeTopic('creatures', 'red-fox', [{ category: 'world', slug: 'ghost-topic' }]);
		expect(() => assertRelatedResolve([fox])).toThrow(/related topic that isn't available/);
	});
});

describe('indexByObservance (calendar↔Library join)', () => {
	it('maps declared ObservanceIds to their topic and ignores topics without one', () => {
		const bosco = fakeTopic('faith', 'saint-john-bosco', [], 'roman:sanctorale:ioannes-bosco');
		const fox = fakeTopic('creatures', 'red-fox');
		const index = indexByObservance([bosco, fox]);
		expect(index.get('roman:sanctorale:ioannes-bosco')).toBe(bosco);
		expect(index.size).toBe(1);
	});

	it('throws when two topics claim the same ObservanceId', () => {
		const a = fakeTopic('faith', 'a', [], 'roman:sanctorale:dupe');
		const b = fakeTopic('faith', 'b', [], 'roman:sanctorale:dupe');
		expect(() => indexByObservance([a, b])).toThrow(/share observanceId/);
	});
});

describe('topicForObservance (live content)', () => {
	it('resolves the seeded Faith article by its ObservanceId', () => {
		const topic = topicForObservance('roman:sanctorale:ioannes-bosco');
		expect(topic?.path).toBe('faith/saint-john-bosco');
	});

	it('returns undefined for an unmapped or nullish id', () => {
		expect(topicForObservance('roman:sanctorale:nobody')).toBeUndefined();
		expect(topicForObservance(null)).toBeUndefined();
		expect(topicForObservance(undefined)).toBeUndefined();
	});
});
