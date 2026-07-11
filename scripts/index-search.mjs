#!/usr/bin/env node
/**
 * Offline search index — the build's search step, folded into `build`
 * (`vite build && pnpm index:search`) so the guards and the offline smoke all
 * see `build/pagefind/**`.
 *
 * Pagefind is a self-contained, vendored binary (platform packages under
 * `@pagefind/*`, no postinstall fetch), so indexing runs fully offline — the
 * whole point of static, no-network search. Only the published topics' article
 * bodies carry `data-pagefind-body`, so Pagefind indexes exactly one record per
 * topic; home/category/error pages are ignored (no `data-pagefind-ignore`
 * choreography needed).
 *
 * Pagefind also emits its OWN default search UI (`pagefind-ui.*`,
 * `pagefind-modular-ui.*`, `pagefind-component-ui.*`, the highlight helper).
 * Bosco ships its own tokenised Svelte UI over the `pagefind.js` search API, so
 * we prune those: they are dead weight AND `pagefind-component-ui.css` embeds
 * bug-tracker URLs in a CSS-hack comment that would (correctly) trip
 * `guard:external`. The core the search API needs — `pagefind.js`,
 * `pagefind-entry.json`, `pagefind-worker.js`, `wasm.*`, `*.pf_meta`,
 * `fragment/`, `index/` — is kept.
 */
import * as pagefind from 'pagefind';
import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

const SITE = 'build';
const BUNDLE = join(SITE, 'pagefind');

/** Default-UI files Bosco doesn't ship (we drive `pagefind.js` from our own UI). */
const PRUNE = [
	'pagefind-ui.js',
	'pagefind-ui.css',
	'pagefind-modular-ui.js',
	'pagefind-modular-ui.css',
	'pagefind-component-ui.js',
	'pagefind-component-ui.css',
	'pagefind-highlight.js'
];

function fail(message, errors) {
	console.error(`\n✗ Search index: ${message}`);
	for (const e of errors ?? []) console.error(`   - ${e}`);
	process.exit(1);
}

const { errors: createErrors, index } = await pagefind.createIndex();
if (!index) fail('could not start the Pagefind indexer.', createErrors);

const { errors: addErrors } = await index.addDirectory({ path: SITE });
if (addErrors.length) fail(`indexing "${SITE}/" failed.`, addErrors);

const { errors: writeErrors } = await index.writeFiles({ outputPath: BUNDLE });
if (writeErrors.length) fail(`writing "${BUNDLE}/" failed.`, writeErrors);

await pagefind.close();

// The authoritative record count is `pagefind-entry.json` — the pages that actually
// carried `data-pagefind-body` (the article bodies). `addDirectory`'s `page_count` is
// files WALKED, not records indexed, so it can't catch a dropped body tag.
const entry = JSON.parse(await readFile(join(BUNDLE, 'pagefind-entry.json'), 'utf8'));
const indexed = Object.values(entry.languages).reduce((n, l) => n + l.page_count, 0);
if (indexed < 1) {
	fail(
		`0 records indexed. A published topic carries \`data-pagefind-body\`; a zero-record ` +
			`index means that tag regressed or no content shipped, so search would be silently empty.`
	);
}

await Promise.all(PRUNE.map((f) => rm(join(BUNDLE, f), { force: true })));

console.log(`✓ Search index: ${indexed} record(s) → ${BUNDLE}/ (default UI pruned)`);
