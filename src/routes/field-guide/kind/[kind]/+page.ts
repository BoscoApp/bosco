import { error } from '@sveltejs/kit';
import { topicsByCategory, type CreatureKind } from '$lib/content';
import { presentKinds } from '$lib/fieldguide/axes';
import type { EntryGenerator, PageLoad } from './$types';

// One prerendered page per kind PRESENT in the gated creature set (e.g. `bestiary`, carried only by the
// gated-out draft basilisk, never mints a page in production).
export const entries: EntryGenerator = () =>
	presentKinds(topicsByCategory('creatures')).map((kind) => ({ kind }));

export const load: PageLoad = ({ params }) => {
	if (!presentKinds(topicsByCategory('creatures')).includes(params.kind as CreatureKind)) {
		error(404, 'No creatures of that kind yet.');
	}
	return { value: params.kind };
};
