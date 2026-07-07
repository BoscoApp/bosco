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
	{ path: '/library/', include: ['The Library', 'The Red Fox', 'The Printing Press'] },
	// The canonical topic page must ship its default-tier PROSE in the prerendered HTML — not an
	// empty {#await} shell. This phrase lives only in the Red Fox's Explorer (tier-2) body, so its
	// presence proves the eager default-tier render (and keeps offline/no-JS/search readable).
	{
		path: '/library/creatures/red-fox/',
		include: ['The Red Fox', 'most widespread wild member of the dog family', 'data-pagefind-body']
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
