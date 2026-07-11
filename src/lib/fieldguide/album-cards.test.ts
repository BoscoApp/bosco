import { describe, it, expect } from 'vitest';
import { buildAlbum } from './album-cards';

interface FakeTopic {
	title: string;
	slug: string;
}

/** A resolver over a small fixture set — the stand-in for `getTopic('creatures', slug)`. */
function resolverFor(topics: FakeTopic[]) {
	return (slug: string) => topics.find((t) => t.slug === slug);
}

describe('buildAlbum', () => {
	it('orders entries alphabetically by title (not by recorded order)', () => {
		const topics: FakeTopic[] = [
			{ slug: 'red-fox', title: 'The Red Fox' },
			{ slug: 'ant', title: 'Ant' },
			{ slug: 'grey-wolf', title: 'Grey Wolf' }
		];
		// Recorded in a deliberately non-alphabetical order.
		const album = buildAlbum(['red-fox', 'ant', 'grey-wolf'], resolverFor(topics));
		expect(album.map((e) => e.topic?.title)).toEqual(['Ant', 'Grey Wolf', 'The Red Fox']);
	});

	it('sorts by TITLE, not by slug or recorded order', () => {
		// Decisive fixture: slug order and title order are INVERTED. Every earlier fixture happened to
		// have slug order == title order, so a regression to sort-by-slug (or by recorded key) would pass
		// them all; here it flips the result and fails.
		const topics: FakeTopic[] = [
			{ slug: 'aardvark', title: 'Zebra Finch' },
			{ slug: 'zebra', title: 'Aardvark' }
		];
		const album = buildAlbum(['aardvark', 'zebra'], resolverFor(topics));
		// Title-sort → 'Aardvark' (slug 'zebra') before 'Zebra Finch' (slug 'aardvark'). Slug-sort flips it.
		expect(album.map((e) => e.slug)).toEqual(['zebra', 'aardvark']);
		expect(album.map((e) => e.topic?.title)).toEqual(['Aardvark', 'Zebra Finch']);
	});

	it('sorts case-insensitively (alphabetical, not ASCII/codepoint order)', () => {
		// 'Zebra' has an UPPERCASE first letter that is alphabetically LAST; a naive `a < b`/codepoint
		// sort would hoist it above the lowercase titles ('Z' 0x5A < 'a' 0x61 → 'Zebra' first). A
		// case-insensitive comparison keeps it last.
		const topics: FakeTopic[] = [
			{ slug: 'z', title: 'Zebra' },
			{ slug: 'a', title: 'apple' },
			{ slug: 'm', title: 'mango' }
		];
		const album = buildAlbum(['z', 'a', 'm'], resolverFor(topics));
		expect(album.map((e) => e.topic?.title)).toEqual(['apple', 'mango', 'Zebra']);
	});

	it('keeps an unresolved slug as an inert entry (topic undefined), sorted by its slug', () => {
		const topics: FakeTopic[] = [{ slug: 'red-fox', title: 'The Red Fox' }];
		// 'ghost-creature' resolves to nothing (un-approved / removed) — it must survive, not vanish.
		const album = buildAlbum(['red-fox', 'ghost-creature'], resolverFor(topics));
		const ghost = album.find((e) => e.slug === 'ghost-creature');
		expect(ghost).toBeDefined();
		expect(ghost?.topic).toBeUndefined();
		// 'ghost-creature' (its own slug is the only label) sorts before 'The Red Fox'.
		expect(album.map((e) => e.slug)).toEqual(['ghost-creature', 'red-fox']);
	});

	it('returns an empty album for no recorded slugs', () => {
		expect(buildAlbum([], resolverFor([]))).toEqual([]);
	});
});
