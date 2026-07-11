import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * The "records, not rewards" stance, made into a gate instead of a manual review.
 *
 * Count/completion/score/streak are not structurally impossible — the view has `listCards()` and the
 * build knows `topicsByCategory('creatures').length`, so "you've collected 5 of 18" is one line away
 * and would pass every other guard. These source-scan invariants fail the build the moment such markup
 * or vocabulary appears in real code; the rendered-DOM half (no `<progress>`, and — crucially — no
 * number or percent ANYWHERE in the album's own chrome, not just its header) lives in the album e2e,
 * over the real built output. Together they cover anti-incentive checklist items 3 (completion
 * pressure) and 4 (score), and they're written to survive the obvious evasions: a COMPUTED percent
 * (`{pct}%`), a derived count (`$derived(cards.length)` → `{n}`), or a badge on the "My album"
 * affordance in the window chrome (outside `.album` entirely).
 *
 * Scans run over comment-STRIPPED source: a comment that names a banned word to explain WHY it's banned
 * (this file, and AlbumView's own header) must not trip the gate — only code and rendered copy count.
 */
function read(relative: string): string {
	return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');
}

/** Drop Svelte/HTML, block, and line comments so only code + rendered copy is scanned. */
function stripComments(src: string): string {
	return src
		.replace(/<!--[\s\S]*?-->/g, ' ')
		.replace(/\/\*[\s\S]*?\*\//g, ' ')
		.replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/** Incentive markup + vocabulary that must never appear on ANY Field Guide surface. */
const INCENTIVE = [
	'<progress',
	'<meter',
	'streak',
	'rarity',
	'badge',
	'trophy',
	'leaderboard',
	'unlock',
	'combo',
	'reward',
	'earn',
	'claim',
	'points',
	'score'
];

/**
 * Completion / percent vocabulary the ALBUM must never carry. Kept off the browse axes (AxisView /
 * FieldGuideHome), which legitimately count the creatures in a habitat — that is browsing, not
 * collection progress. Applied to the album view and the window host that frames it.
 */
const ALBUM_COMPLETION = ['percent', 'complete', 'total'];

/**
 * Every Field Guide DISPLAY surface — including the window host, which renders the "My album"
 * affordance in `.fg-bar` (outside `.album`, so a `My album (3)` badge there would dodge a
 * `.album`-scoped DOM check).
 */
const SURFACES: Record<string, string> = {
	AlbumView: './AlbumView.svelte',
	FieldGuideHome: './FieldGuideHome.svelte',
	AxisView: './AxisView.svelte',
	FieldGuideBody: '../portal/windows/FieldGuideBody.svelte'
};

/** The album surfaces that must additionally carry no completion/percent vocabulary. */
const ALBUM_SURFACES: Record<string, string> = {
	AlbumView: './AlbumView.svelte',
	FieldGuideBody: '../portal/windows/FieldGuideBody.svelte'
};

describe('album is records-not-rewards (anti-incentive gate)', () => {
	it('no Field Guide surface carries incentive markup or vocabulary', () => {
		for (const [name, path] of Object.entries(SURFACES)) {
			const src = stripComments(read(path)).toLowerCase();
			for (const term of INCENTIVE) {
				expect(src, `${name} must not contain "${term}"`).not.toContain(term);
			}
		}
	});

	it('no album surface carries completion / percent vocabulary', () => {
		for (const [name, path] of Object.entries(ALBUM_SURFACES)) {
			const src = stripComments(read(path)).toLowerCase();
			for (const term of ALBUM_COMPLETION) {
				expect(src, `${name} must not contain "${term}"`).not.toContain(term);
			}
		}
	});

	it('the album renders no count, no percent, and no computed ratio off the card set', () => {
		const src = stripComments(read('./AlbumView.svelte'));
		// No bare `{….length}` OUTPUT mustache (the negative lookahead skips Svelte block tags
		// `{#…}`/`{/…}`/`{:…}`, so the `{#if …cards.length}` guard is fine but a rendered count is not).
		expect(src).not.toMatch(/\{\s*(?![#/:@])[^{}]*\.length\s*\}/);
		// No hardcoded percent ("50%") AND no COMPUTED percent display ("{pct}%", where the char before
		// `%` is `}`). The literal-digit-only form was the review's escape hatch — both are closed now.
		expect(src).not.toMatch(/\d+\s*%/);
		expect(src).not.toMatch(/\}\s*%/);
		// No number DERIVED from the card set to feed the view ("$derived(cards.length …)" → "{n}").
		expect(src).not.toMatch(/\$derived\([^)]*\.length/);
		// No "N of {total}" completion phrase.
		expect(src).not.toMatch(/\bof\s*\{/);
	});

	it('the pinned empty / no-profile copy is present verbatim', () => {
		const src = read('./AlbumView.svelte');
		expect(src).toContain('Creatures you’ve read about show up here.');
		expect(src).toContain('Make a profile to start your own album.');
	});
});

describe('the browse index reads no album/profile state', () => {
	// FG-3a drew this line: the by-habitat / by-kind index is browsing, not a checklist. Reading album
	// state there would let a "✓ recorded" badge or greyed-unread treatment manufacture collect-'em-all
	// pressure while passing every structural gate. The album VIEW is the one FG surface that may — the
	// window HOST wires it, but must keep album state inside AlbumView, not in its own chrome.
	const STATE_FREE: Record<string, string> = {
		FieldGuideHome: './FieldGuideHome.svelte',
		AxisView: './AxisView.svelte',
		FieldGuideBody: '../portal/windows/FieldGuideBody.svelte'
	};

	it('the index components and the window host import no persistence layer', () => {
		for (const [name, path] of Object.entries(STATE_FREE)) {
			const src = read(path);
			expect(src, `${name} imports no $lib/state`).not.toContain('$lib/state');
			expect(src, `${name} uses no album helper`).not.toMatch(/\b(recordCard|hasCard|listCards)\b/);
		}
	});
});
