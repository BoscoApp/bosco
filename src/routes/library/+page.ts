import { topics } from '$lib/content';

// Prerendered from the build-time virtual content module. In production only `approved`
// topics are present (the doctrine gate). This bare listing is the v0.1.0 proof surface;
// the real Library UI arrives in v0.3.0.
export function load() {
	return {
		topics: topics.map((t) => ({
			path: t.path,
			slug: t.slug,
			title: t.title,
			category: t.category,
			summary: t.summary,
			tiers: t.tiers
		}))
	};
}
