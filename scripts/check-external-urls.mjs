#!/usr/bin/env node
/**
 * External-URL guard — the offline invariant, enforced.
 *
 * Bosco must run with zero external network at runtime (brief §5, hard rule 1).
 * This scans the prerendered `build/` output and fails the build if anything would
 * trigger an off-origin fetch: an absolute `http(s)://` reference, or a
 * protocol-relative `//host` reference, in markup/CSS/JSON — or an explicit fetch
 * call site in bundled JS.
 *
 * Same-origin references (root-relative `/x`, relative `./x`, `#frag`, `data:`,
 * `mailto:`) are fine. XML/SVG namespace URIs (w3.org) are identifiers, not fetches.
 *
 * Run via `pnpm guard:external` after `pnpm build`.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const BUILD_DIR = 'build';

/** URIs that look like URLs but never cause a network request. */
const ALLOW = [/^https?:\/\/www\.w3\.org\//i];

/** File types whose external references would trigger a page-load fetch. */
const MARKUP = new Set(['.html', '.htm', '.css', '.svg', '.xml', '.json', '.webmanifest', '.txt']);

const ABSOLUTE = /https?:\/\/[^\s"'`)<>\\]+/gi;
const PROTOCOL_RELATIVE =
	/(?:src|href|srcset|action|formaction|poster|data|url\()\s*[=(]?\s*["'(]?\s*\/\/[a-z0-9.-]+/gi;
const JS_FETCH =
	/(?:fetch|importScripts|navigator\.sendBeacon|new\s+Worker|new\s+EventSource|new\s+WebSocket)\s*\(\s*[`'"](?:https?:)?\/\/[^`'"]+/gi;

async function* walk(dir) {
	let entries;
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch {
		console.error(`✗ External-URL guard: "${dir}/" not found. Run \`pnpm build\` first.`);
		process.exit(1);
	}
	for (const entry of entries) {
		const p = join(dir, entry.name);
		if (entry.isDirectory()) yield* walk(p);
		else yield p;
	}
}

const allowed = (url) => ALLOW.some((re) => re.test(url));
const violations = [];

for await (const file of walk(BUILD_DIR)) {
	const ext = extname(file).toLowerCase();
	if (ext === '.map') continue;
	const text = await readFile(file, 'utf8');

	if (MARKUP.has(ext)) {
		for (const m of text.matchAll(ABSOLUTE)) {
			if (!allowed(m[0])) violations.push(`${file}: ${m[0].slice(0, 100)}`);
		}
		for (const m of text.matchAll(PROTOCOL_RELATIVE)) {
			violations.push(`${file}: ${m[0].slice(0, 100)}`);
		}
	} else if (ext === '.js' || ext === '.mjs' || ext === '.cjs') {
		// Skip bare license-banner URLs; flag only real call sites.
		for (const m of text.matchAll(JS_FETCH)) {
			violations.push(`${file}: ${m[0].slice(0, 100)}`);
		}
	}
}

if (violations.length) {
	console.error(
		`\n✗ External-URL guard: ${violations.length} external reference(s) in ${BUILD_DIR}/:\n`
	);
	for (const v of violations) console.error(`   - ${v}`);
	console.error('\nBosco must run with zero external network. Bundle the asset locally.\n');
	process.exit(1);
}

console.log(`✓ External-URL guard: no external references in ${BUILD_DIR}/`);
