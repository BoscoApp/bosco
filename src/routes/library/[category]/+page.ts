import { error } from '@sveltejs/kit';
import { topicsByCategory } from '$lib/content';
import { CATEGORIES, type Category } from '$lib/content/schema';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

// One landing page per category. Enumerated so adapter-static emits every category — even one with
// no approved topics yet (its page shows an empty state, never a 404). A link to any other
// `[category]` value would fail the strict build rather than 404 at runtime.
export const entries: EntryGenerator = () => CATEGORIES.map((category) => ({ category }));

export const load: PageLoad = ({ params }) => {
	if (!CATEGORIES.includes(params.category as Category)) {
		error(404, `No such category: ${params.category}`);
	}
	const category = params.category as Category;
	// Only serialisable fields cross the load boundary; the tier components stay in the content module.
	const topics = topicsByCategory(category).map((t) => ({
		path: t.path,
		title: t.frontmatter.title,
		summary: t.frontmatter.summary ?? null
	}));
	return { category, topics };
};
