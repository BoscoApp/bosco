import { error } from '@sveltejs/kit';
import { CATEGORIES, type Category } from '$lib/content';
import type { EntryGenerator, PageLoad } from './$types';

// One prerendered shelf per category — including empty ones (which show an empty state).
export const entries: EntryGenerator = () => CATEGORIES.map((category) => ({ category }));

export const load: PageLoad = ({ params }) => {
	if (!CATEGORIES.includes(params.category as Category)) {
		error(404, 'That shelf isn’t in the Library.');
	}
	return { category: params.category as Category };
};
