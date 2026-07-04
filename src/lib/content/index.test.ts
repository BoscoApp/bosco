import { describe, it, expect } from 'vitest';
import { assertRelatedResolve, type Topic } from './index';
import type { Frontmatter } from './schema';

// Minimal Topic fakes — assertRelatedResolve only reads slug, path, and frontmatter.{category,related}.
function fakeTopic(
	category: string,
	slug: string,
	related: { category: string; slug: string }[] = []
): Topic {
	return {
		slug,
		path: `${category}/${slug}`,
		frontmatter: { category, related } as unknown as Frontmatter,
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
