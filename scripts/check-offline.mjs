#!/usr/bin/env node
/**
 * Offline smoke — proves the built static output serves every route with no backend and no
 * network, standing in for `docker run --network none`. Combined with the external-URL guard
 * (no external references in output), this is the CI-fast proof of the offline invariant; the
 * browser-runtime proof is the Playwright e2e (tests/e2e/offline.spec.ts).
 *
 * Run against a completed build: `pnpm build && pnpm guard:offline`.
 */
import { createStaticServer } from './serve-static.mjs';

const server = createStaticServer('build');
await new Promise((resolve, reject) => {
	server.once('error', reject);
	server.listen(0, resolve);
});
const { port } = server.address();
const base = `http://localhost:${port}`;

const routes = [
	{ path: '/', include: ['Bosco'] },
	// "Surprise me" is a real prerendered link (a random-topic <a>, seeded deterministically), so it
	// must be present in the static HTML for a no-JS reader.
	{
		path: '/library/',
		include: [
			'The Library',
			'The Red Fox',
			'The Printing Press',
			'Surprise me',
			'Search the Library'
		]
	},
	// The canonical topic page must ship its default-tier PROSE in the prerendered HTML — not an
	// empty {#await} shell. This phrase lives only in the Red Fox's Explorer (tier-2) body, so its
	// presence proves the eager default-tier render (and keeps offline/no-JS/search readable). The
	// "See also" section + its resolved target prove curated cross-links prerender too.
	{
		path: '/library/creatures/red-fox/',
		include: [
			'The Red Fox',
			'most widespread wild member of the dog family',
			'data-pagefind-body',
			'See also',
			'The Printing Press',
			// The glossary term bakes into the prerendered HTML as a plain <button> with its definition in
			// a data-attr — readable with no JS, upgraded to a toggletip on hydration.
			'class="gloss-term"',
			'data-gloss-def=',
			// The Archives shelf is gated on the topic OFFERING Scholar (not the reader's live tier), so it
			// prerenders into the static HTML — no-JS readable, not a JS-only afterthought. Red Fox offers
			// Scholar and declares no archives, so its empty teaser must be present.
			'The Archives',
			'still stocking these shelves'
		]
	},
	// A category landing renders offline with its enrichment: the article count and the static
	// "reading levels this shelf offers" strip (Red Fox is the only approved creature and offers all three).
	{
		path: '/library/creatures/',
		include: ['Creatures', '1 article', 'Written for Seedling, Explorer, Scholar']
	},
	// The Field Guide hub prerenders the WHOLE creature index with no JS — both groupings inline. Red
	// Fox is the only approved creature, so it appears under its habitats (Woodland, Farmland) and its
	// kind (Mammals); a no-JS reader gets the complete index on one page.
	{
		path: '/field-guide/',
		include: ['The Field Guide', 'By habitat', 'By kind', 'Woodland', 'The Red Fox']
	}
];

const failures = [];

for (const { path, include } of routes) {
	try {
		const res = await fetch(base + path);
		if (res.status !== 200) {
			failures.push(`${path} -> HTTP ${res.status}`);
			continue;
		}
		const html = await res.text();
		for (const token of include) {
			if (!html.includes(token)) failures.push(`${path} missing "${token}"`);
		}
	} catch (err) {
		failures.push(`${path} -> ${err.message}`);
	}
}

// "Surprise me" must bake a DETERMINISTIC href into the prerendered HTML — the first topic by path
// (creatures/red-fox), never a Math.random pick at build time (which would cause an SSR/hydration
// mismatch and a random no-JS destination). The client re-rolls it after hydration; that behaviour is
// pinned separately by the e2e. Target the .surprise anchor specifically so the Red Fox's own TopicCard
// href on the same page can't satisfy this by accident.
const libHomeUrl = `${base}/library/`;
const libHome = await (await fetch(libHomeUrl)).text();
const surpriseTag = libHome.match(/<a\b[^>]*\bclass="[^"]*\bsurprise\b[^"]*"[^>]*>/);
const surpriseHref = surpriseTag?.[0].match(/\bhref="([^"]*)"/)?.[1];
// adapter-static emits reload-safe RELATIVE hrefs (e.g. "../library/creatures/red-fox/"), so resolve
// against the page URL before comparing the path.
const surpriseResolved = surpriseHref && new URL(surpriseHref, libHomeUrl).pathname;
if (surpriseResolved !== '/library/creatures/red-fox/') {
	failures.push(
		`Surprise-me seed href is "${surpriseHref}" (expected the deterministic first topic)`
	);
}

// The offline search bundle must SHIP and be reachable with no network — the runtime `pagefind.js`
// served as JavaScript, and a search index carrying at least one record (proving the build's
// `index:search` step ran over the prerendered pages). The browser-runtime search is proven by the
// e2e; this is the browser-free, docker-run-none proof that the bundle is present and non-empty.
const pfJs = await fetch(`${base}/pagefind/pagefind.js`);
if (pfJs.status !== 200) {
	failures.push(`/pagefind/pagefind.js -> HTTP ${pfJs.status} (search bundle missing)`);
} else if (!/javascript/i.test(pfJs.headers.get('content-type') ?? '')) {
	failures.push(`/pagefind/pagefind.js served as "${pfJs.headers.get('content-type')}" (not JS)`);
}
const pfEntry = await fetch(`${base}/pagefind/pagefind-entry.json`);
if (pfEntry.status !== 200) {
	failures.push(`/pagefind/pagefind-entry.json -> HTTP ${pfEntry.status} (no search index)`);
} else {
	const entry = await pfEntry.json();
	const records = Object.values(entry.languages ?? {}).reduce((n, l) => n + (l.page_count ?? 0), 0);
	if (records < 1) failures.push(`search index has ${records} record(s) (expected at least 1)`);
}

// A missing page must 404 (no silent SPA fallback under adapter-static).
const missing = await fetch(`${base}/definitely-not-a-page/`);
if (missing.status !== 404) failures.push(`missing page -> HTTP ${missing.status} (expected 404)`);

server.close();

if (failures.length) {
	console.error('\n✗ Offline smoke failed:');
	for (const f of failures) console.error(`   - ${f}`);
	process.exit(1);
}
console.log('✓ Offline smoke: static output serves all routes with no backend.');
