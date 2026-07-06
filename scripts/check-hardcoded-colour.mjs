#!/usr/bin/env node
/**
 * Hardcoded-colour guard — the design-token discipline, enforced.
 *
 * The palette lives in exactly one place: `src/lib/styles/tokens.css`. Every component references
 * it through `var(--…)`. This scans CSS declaration values (in `.css` files and `<style>` blocks of
 * `.svelte` components) and fails on any brand/neutral colour written as a literal — a hex like
 * `#2e5aa8`, or a saturated `rgb()/hsl()`. That keeps theming coherent and makes the liturgical /
 * tier axes actually swappable.
 *
 * Allowed literals (incidental, not part of the palette): pure white/black hex (`#fff`, `#000` and
 * their 4/6/8-digit forms), and greyscale `rgb()/rgba()/hsl()/hsla()` used for shadows and
 * highlights (equal channels, or 0% saturation). Everything coloured must be a token.
 *
 * Only declaration *values* are scanned, so `#id` selectors are never mistaken for colours. The two
 * token files (tokens.css, fonts.css) are the source of truth and are skipped.
 *
 * Run via `pnpm guard:colour`.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';

const ROOT = 'src';
const SKIP = new Set(['tokens.css', 'fonts.css']);

const DECL = /([\w-]+)\s*:\s*([^;{}]+)/g;
const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const FN = /\b(rgba?|hsla?)\(([^)]*)\)/gi;

function stripComments(css) {
	// Replace comment bodies with same-length whitespace so line numbers stay true.
	return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}
function lineAt(text, idx) {
	return text.slice(0, idx).split('\n').length;
}
function hexAllowed(hex) {
	const s = hex.slice(1).toLowerCase();
	if (![3, 4, 6, 8].includes(s.length)) return true; // not a colour length; ignore
	return (
		/^(?:f+|0+)$/.test(s) && (s.length === 3 || s.length === 4 || s.length === 6 || s.length === 8)
	);
}
function fnAllowed(name, args) {
	const n = args.split(/[,/]/).map((a) => a.trim());
	if (/^rgba?$/i.test(name)) return n[0] === n[1] && n[1] === n[2]; // greyscale only
	return /^0%?$/.test(n[1] ?? ''); // hsl: 0% saturation only
}

const violations = [];

/** Scan a unit of CSS text; `fullText`/`unitStart` map matches back to file lines. */
function scanCss(css, file, fullText, unitStart) {
	const clean = stripComments(css);
	for (const d of clean.matchAll(DECL)) {
		const value = d[2];
		const valueStart = d.index + d[0].length - value.length;
		for (const h of value.matchAll(HEX)) {
			if (hexAllowed(h[0])) continue;
			if (![4, 5, 7, 9].includes(h[0].length)) continue; // '#'+{3,4,6,8}
			const at = unitStart + valueStart + h.index;
			violations.push(`${file}:${lineAt(fullText, at)}  ${h[0]}`);
		}
		for (const f of value.matchAll(FN)) {
			if (fnAllowed(f[1], f[2])) continue;
			const at = unitStart + valueStart + f.index;
			violations.push(`${file}:${lineAt(fullText, at)}  ${f[0].slice(0, 40)}`);
		}
	}
}

async function* walk(dir) {
	for (const e of await readdir(dir, { withFileTypes: true })) {
		const p = join(dir, e.name);
		if (e.isDirectory()) yield* walk(p);
		else yield p;
	}
}

for await (const file of walk(ROOT)) {
	const ext = extname(file).toLowerCase();
	if (ext === '.css') {
		if (SKIP.has(basename(file))) continue;
		const text = await readFile(file, 'utf8');
		scanCss(text, file, text, 0);
	} else if (ext === '.svelte') {
		const text = await readFile(file, 'utf8');
		for (const block of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
			const inner = block[1];
			const start = block.index + block[0].indexOf(inner);
			scanCss(inner, file, text, start);
		}
	}
}

if (violations.length) {
	console.error(
		`\n✗ Hardcoded-colour guard: ${violations.length} literal colour(s) outside tokens.css:\n`
	);
	for (const v of violations) console.error(`   - ${v}`);
	console.error(
		'\nMove the colour into src/lib/styles/tokens.css and reference it via var(--…).\n'
	);
	process.exit(1);
}

console.log('✓ Hardcoded-colour guard: all component colours come from tokens.');
