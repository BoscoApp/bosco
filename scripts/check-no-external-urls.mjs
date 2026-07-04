/*
 * The offline invariant, enforced (brief §5 CI guardrail — a Phase 0 deliverable). Scans the BUILT
 * output for anything that would cause a runtime network request and FAILS the build if it finds
 * one. This turns "offline-first" from an intention into a checked invariant.
 *
 * Trustworthy, not noisy — this is the key design decision. A naive "any https:// in any file"
 * grep is USELESS here: framework/library JS is full of URL string literals that are never fetched
 * (Svelte's `svelte.dev/e/*` error-doc links, Zod's `json-schema.org` `$schema` ids, Pagefind's
 * `example.com` URL-parsing placeholders and translator-credit links, CSS comment links to bug
 * trackers). Flagging those trains everyone to ignore the check. So we scan by file type for REAL
 * subresource references:
 *
 *   - HTML / SVG / XML : external src/href/srcset/poster/... attributes, inline url(), @import.
 *                        (This also catches kid-facing external <a href> links — a §7 requirement.)
 *   - CSS              : external url(...) and @import (external fonts/images).
 *   - JS               : known analytics / CDN / font / tracker hosts only. A hand-written
 *                        fetch('https://…') to some other host is NOT caught here by design —
 *                        it is caught at RUNTIME by the Playwright offline smoke (e2e/offline.e2e.ts),
 *                        which blocks every non-localhost request and asserts zero. Static scan +
 *                        runtime block are layered on purpose.
 *   - JSON/webmanifest : beacon hosts (+ external values in a web app manifest).
 *
 * Usage: node scripts/check-no-external-urls.mjs [buildDir]   (default: build)
 */
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.argv[2] || 'build';

// Namespace URIs and w3.org identifiers are never fetched by the browser for rendering.
const ALLOW_PREFIX = ['http://www.w3.org/', 'https://www.w3.org/'];
function allowed(url) {
	const u = url.replace(/[.,;:'")\]}>]+$/, '');
	return ALLOW_PREFIX.some((p) => u.startsWith(p));
}

// Known analytics / CDN / embed / font hosts — the common accidental leaks. Flagged in any file.
const BEACON_HOSTS = [
	'google-analytics.com',
	'googletagmanager.com',
	'fonts.googleapis.com',
	'fonts.gstatic.com',
	'cdn.jsdelivr.net',
	'unpkg.com',
	'cdnjs.cloudflare.com',
	'doubleclick.net',
	'connect.facebook.net',
	'facebook.com/tr',
	'hotjar.com',
	'sentry.io',
	'plausible.io',
	'segment.com',
	'mixpanel.com',
	'googlesyndication.com'
];

// External subresource references in markup: src/href/srcset/poster/action/xlink:href/... = "http…"
const MARKUP_SUBRESOURCE =
	/\b(?:src|href|srcset|poster|action|formaction|xlink:href|data)\s*=\s*["']?\s*(https?:\/\/[^"'\s>]+)/gi;
// External url(...) or @import in CSS (and inline styles inside markup).
const CSS_EXTERNAL = /(?:url\(\s*["']?|@import\s+(?:url\(\s*)?["']?)\s*(https?:\/\/[^"')\s]+)/gi;
// Any absolute URL value (used for web app manifest values).
const ABSOLUTE = /https?:\/\/[^"'`)\s>]+/gi;

const MARKUP_EXT = new Set(['.html', '.htm', '.svg', '.xml']);
const CSS_EXT = new Set(['.css']);
const JS_EXT = new Set(['.js', '.mjs', '.cjs']);
const VALUE_EXT = new Set(['.webmanifest']);
const SCAN_EXT = new Set([...MARKUP_EXT, ...CSS_EXT, ...JS_EXT, ...VALUE_EXT, '.json', '.txt']);

function* walk(dir) {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		const st = statSync(full);
		if (st.isDirectory()) yield* walk(full);
		else yield full;
	}
}

const violations = [];
function add(file, lineNo, match, why) {
	violations.push({ file, line: lineNo, match: match.slice(0, 140), why });
}

function scanBeacons(file, lineNo, line) {
	const lower = line.toLowerCase();
	for (const host of BEACON_HOSTS) {
		if (lower.includes(host)) add(file, lineNo, `beacon host: ${host}`, 'beacon');
	}
}

function scanMatches(file, lineNo, line, regex, why) {
	for (const m of line.matchAll(regex)) {
		const url = m[1] ?? m[0];
		if (!allowed(url)) add(file, lineNo, url, why);
	}
}

for (const file of walk(ROOT)) {
	const ext = extname(file).toLowerCase();
	if (!SCAN_EXT.has(ext)) continue;
	const lines = readFileSync(file, 'utf8').split(/\r?\n/);
	lines.forEach((line, i) => {
		const n = i + 1;
		scanBeacons(file, n, line);
		if (MARKUP_EXT.has(ext)) {
			scanMatches(file, n, line, MARKUP_SUBRESOURCE, 'external subresource');
			scanMatches(file, n, line, CSS_EXTERNAL, 'external css url');
		} else if (CSS_EXT.has(ext)) {
			scanMatches(file, n, line, CSS_EXTERNAL, 'external css url');
		} else if (VALUE_EXT.has(ext)) {
			scanMatches(file, n, line, ABSOLUTE, 'external manifest value');
		}
		// JS and JSON: beacon hosts only (handled above). Non-beacon URL string literals in JS are
		// not fetches; actual runtime fetches are caught by the offline Playwright smoke.
	});
}

if (violations.length > 0) {
	console.error(
		`\n✗ External-URL guardrail FAILED — ${violations.length} occurrence(s) in ${ROOT}/:\n`
	);
	for (const v of violations) console.error(`  [${v.why}] ${v.file}:${v.line}\n    ${v.match}`);
	console.error(
		'\nEverything must be bundled (brief §5 hard rule 1). Bundle the asset, or if this is a genuine\nnon-network namespace URI, extend the allowlist in scripts/check-no-external-urls.mjs (a reviewed change).\n'
	);
	process.exit(1);
}

console.log(`✓ No external subresources or beacon hosts in ${ROOT}/ — offline invariant holds.`);
