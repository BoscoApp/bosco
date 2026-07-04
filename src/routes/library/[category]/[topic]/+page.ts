import { error } from '@sveltejs/kit';
import { topics, getTopic } from '$lib/content';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

// Enumerate exactly the (non-pending) topics so adapter-static knows every page to emit. A link
// to any other topic would fail the strict build rather than 404 at runtime.
export const entries: EntryGenerator = () =>
	topics.map((t) => ({ category: t.frontmatter.category, topic: t.slug }));

export const load: PageLoad = ({ params }) => {
	const topic = getTopic(params.category, params.topic);
	if (!topic) error(404, `Topic not found: ${params.category}/${params.topic}`);
	// Only serialisable data crosses the load boundary; the tier components (not serialisable) are
	// re-resolved in the page from the bundled content module.
	return {
		category: params.category,
		topic: params.topic,
		frontmatter: topic.frontmatter
	};
};
