import { describe, it, expect } from 'vitest';
import { toHit } from './pagefind';

describe('toHit', () => {
	it('maps a Pagefind doc to a hit, carrying title and excerpt through', () => {
		const hit = toHit('', {
			url: '/library/creatures/red-fox/',
			meta: { title: 'The Red Fox' },
			excerpt: 'A clever <mark>fox</mark>.'
		});
		expect(hit).toEqual({
			url: '/library/creatures/red-fox/',
			title: 'The Red Fox',
			excerpt: 'A clever <mark>fox</mark>.'
		});
	});

	it('prepends a non-empty base to the root-relative Pagefind url', () => {
		// Pagefind indexes the built site root, so its urls are root-relative; a deployment base path
		// must be re-applied so the link (and the desktop /library intercept) stay correct.
		const hit = toHit('/bosco', {
			url: '/library/world/printing-press/',
			meta: { title: 'The Printing Press' },
			excerpt: '…'
		});
		expect(hit.url).toBe('/bosco/library/world/printing-press/');
	});

	it('falls back to the url when a result carries no title', () => {
		const hit = toHit('', { url: '/library/x/y/', excerpt: '…' });
		expect(hit.title).toBe('/library/x/y/');
	});
});
