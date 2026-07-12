#!/usr/bin/env node
/**
 * SVG-cleanliness guard — committed SVGs must be SVGO-clean.
 *
 * Bosco commits SVGs (the favicon today; the Field Guide's diagram / range plates as they land). A
 * hand-authored or Inkscape/Illustrator SVG routinely embeds editor and RDF namespaces
 * (`xmlns:sodipodi`, `xmlns:inkscape`, `xmlns:cc`, `xmlns:dc`, `xmlns:rdf`), a `<metadata>` block, and
 * license URLs (`creativecommons.org`, `purl.org`). Every one of those carries an absolute off-origin
 * URL — a `guard:external` violation the moment it reaches `build/` — and the Pagefind prune step runs
 * over `build/` only, covering no `static/` asset. So this guard checks the SOURCE and fails BEFORE the
 * build. The ONE absolute URL an SVG may carry is the SVG/XML namespace on `www.w3.org`, which is an
 * identifier and never fetched (the same allowlist `check-external-urls.mjs` uses). Do not widen it.
 *
 * Run via `pnpm guard:svg`.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

/** Roots that hold committed SVGs. `build/` is the compiled output — not scanned here. */
const ROOTS = ['static', 'src'];

/** Editor/RDF/license markers that SVGO strips; any surviving one is a dirty commit. */
const PATTERNS = [
	{ re: /\bxmlns:(?:sodipodi|inkscape|dc|cc|rdf|svg)\b/i, why: 'editor/RDF namespace declaration' },
	{ re: /<\/?(?:sodipodi|inkscape|dc|cc|rdf):[\w-]/i, why: 'editor/RDF element' },
	{ re: /\b(?:sodipodi|inkscape):[\w-]+\s*=/i, why: 'editor attribute' },
	{ re: /<metadata[\s>]/i, why: '<metadata> block (usually RDF/license)' },
	{
		re: /creativecommons\.org|purl\.org|inkscape\.org|sodipodi\.sourceforge/i,
		why: 'embedded license/editor URL'
	}
];

/** Any absolute URL that is NOT the w3.org namespace is disallowed outright. */
const ABSOLUTE = /https?:\/\/[^\s"'`)<>\\]+/gi;
const ALLOWED_ABS = /^https?:\/\/www\.w3\.org\//i;

/** Pure detector: the list of cleanliness problems in one SVG's source text (empty = clean). */
export function findSvgIssues(text) {
	const issues = [];
	for (const { re, why } of PATTERNS) {
		const m = text.match(re);
		if (m) issues.push(`${why} (${m[0]})`);
	}
	for (const m of text.matchAll(ABSOLUTE)) {
		if (!ALLOWED_ABS.test(m[0])) issues.push(`off-origin URL: ${m[0].slice(0, 80)}`);
	}
	return issues;
}

async function* walk(dir) {
	let entries;
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch {
		return; // a missing root (e.g. no static/) is simply nothing to scan
	}
	for (const e of entries) {
		const p = join(dir, e.name);
		if (e.isDirectory()) yield* walk(p);
		else yield p;
	}
}

async function main() {
	const violations = [];
	let scanned = 0;
	for (const root of ROOTS) {
		for await (const file of walk(root)) {
			if (extname(file).toLowerCase() !== '.svg') continue;
			scanned++;
			const text = await readFile(file, 'utf8');
			for (const issue of findSvgIssues(text)) violations.push(`${file}: ${issue}`);
		}
	}

	if (violations.length) {
		console.error(
			`\n✗ SVG-cleanliness guard: ${violations.length} problem(s) in committed SVGs:\n`
		);
		for (const v of violations) console.error(`   - ${v}`);
		console.error(
			'\nRun the SVG through SVGO (strip editor/RDF namespaces + <metadata>) before commit.\n'
		);
		process.exit(1);
	}
	console.log(`✓ SVG-cleanliness guard: ${scanned} committed SVG(s) clean.`);
}

// Only run the filesystem scan when invoked as a script — importing this module (the unit test) must not
// walk the tree or exit. Robust on Windows via fileURLToPath + resolve.
const invokedDirectly =
	process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1]);
if (invokedDirectly) await main();
