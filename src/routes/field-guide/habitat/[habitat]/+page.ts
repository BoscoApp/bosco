import { error } from '@sveltejs/kit';
import { topicsByCategory, type Habitat } from '$lib/content';
import { presentHabitats } from '$lib/fieldguide/axes';
import type { EntryGenerator, PageLoad } from './$types';

// One prerendered page per habitat PRESENT in the gated creature set — never an empty axis page, and a
// value that only a gated-out (pending) creature carries is never minted.
export const entries: EntryGenerator = () =>
	presentHabitats(topicsByCategory('creatures')).map((habitat) => ({ habitat }));

export const load: PageLoad = ({ params }) => {
	if (!presentHabitats(topicsByCategory('creatures')).includes(params.habitat as Habitat)) {
		error(404, 'No creatures live there yet.');
	}
	return { value: params.habitat };
};
