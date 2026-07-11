import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Structural guards for the album's write path. These assert the SEAM, not behaviour (behaviour lives
 * in album.test.ts + the e2e IndexedDB checks): the article view must stay a pure, state-free component,
 * every host that shows an article must mount the recorder, and the recorder must record from a one-shot
 * `onMount` — never a reactive `$effect` — so a profile switch while an article stays open records nothing.
 * A refactor that quietly breaks any of these would slip past the runtime tests but fails here.
 */
function read(relative: string): string {
	return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');
}

/** The three in-repo hosts that render an ArticleView, and so must each mount a RecordOnRead beside it. */
const HOSTS: Record<string, string> = {
	'standalone route': '../../routes/library/[category]/[topic]/+page.svelte',
	'Library window': '../portal/windows/LibraryBody.svelte',
	'Field Guide window': '../portal/windows/FieldGuideBody.svelte'
};

describe('record-on-read wiring', () => {
	it('every article host imports and mounts RecordOnRead', () => {
		for (const [name, path] of Object.entries(HOSTS)) {
			const src = read(path);
			expect(src, `${name} imports RecordOnRead`).toContain(
				"import RecordOnRead from '$lib/fieldguide/RecordOnRead.svelte'"
			);
			expect(src, `${name} mounts <RecordOnRead>`).toContain('<RecordOnRead {topic}');

			// …and INSIDE the {#key topic.path} block, so each distinct topic re-mounts it and records on
			// read. A refactor that hoisted it out of the block would keep the string match above but
			// silently stop per-topic recording (onMount would fire once for the host, not per article).
			const keyStart = src.indexOf('{#key topic.path}');
			expect(keyStart, `${name} has a {#key topic.path} block`).toBeGreaterThan(-1);
			const keyRegion = src.slice(keyStart, src.indexOf('{/key}', keyStart));
			expect(keyRegion, `${name} mounts <RecordOnRead> inside {#key topic.path}`).toContain(
				'<RecordOnRead {topic}'
			);
		}
	});

	it('ArticleView stays state-free (never imports the persistence layer)', () => {
		const src = read('../library/ArticleView.svelte');
		expect(src).not.toContain('$lib/state');
		expect(src).not.toContain('recordCard');
	});

	it('RecordOnRead records from onMount, not a reactive $effect', () => {
		const src = read('./RecordOnRead.svelte');
		expect(src).toContain('onMount(');
		// The whole point of onMount here is that activeProfile is NOT a reactive dependency; an $effect
		// would re-run on a profile switch and mis-record. Lock that structural choice — match the CALL
		// form, not the bare word (the header comment names `$effect` in prose to explain the choice).
		expect(src).not.toContain('$effect(');
		// Creatures-only: no other category is ever recorded into the album.
		expect(src).toContain("topic.category !== 'creatures'");
	});
});
