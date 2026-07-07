import { error } from '@sveltejs/kit';
import { getTopic, topics, type Category } from '$lib/content';
import type { EntryGenerator, PageLoad } from './$types';

// One prerendered HTML file per PUBLISHED topic (production = approved only, from the gated
// content module). A topic without an entry here would fail the adapter-static strict build.
export const entries: EntryGenerator = () =>
	topics.map((t) => ({ category: t.category, topic: t.slug }));

// Return only serializable identity — the Topic carries loader functions, which devalue cannot
// serialize for hydration. The page re-resolves the Topic from the build-time content module.
export const load: PageLoad = ({ params }) => {
	const topic = getTopic(params.category as Category, params.topic);
	if (!topic) error(404, 'That topic isn’t in the Library.');
	return { category: topic.category, slug: topic.slug, title: topic.title };
};
