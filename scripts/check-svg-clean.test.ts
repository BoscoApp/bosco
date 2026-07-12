import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { findSvgIssues } from './check-svg-clean.mjs';

/**
 * The SVG-cleanliness guard's pure detector, proven both ways (a clean SVG trips nothing; each dirty
 * marker is caught) so the guard can't quietly fail open. The full filesystem scan runs in CI via
 * `pnpm guard:svg`; this pins the logic and the w3.org allowlist.
 */
describe('findSvgIssues', () => {
	const CLEAN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32"/></svg>`;

	it('passes a clean SVG that carries only the w3.org namespace', () => {
		expect(findSvgIssues(CLEAN)).toEqual([]);
	});

	it('passes an SVG with an xlink namespace on w3.org (still an identifier, never fetched)', () => {
		const withXlink = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"></svg>`;
		expect(findSvgIssues(withXlink)).toEqual([]);
	});

	it('catches Inkscape / Sodipodi namespaces and attributes', () => {
		expect(
			findSvgIssues(`<svg xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"></svg>`)
				.length
		).toBeGreaterThan(0);
		expect(
			findSvgIssues(
				`<svg xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.0.dtd"></svg>`
			).length
		).toBeGreaterThan(0);
		expect(
			findSvgIssues(`<rect inkscape:label="layer1" sodipodi:role="line"/>`).length
		).toBeGreaterThan(0);
	});

	it('catches an RDF <metadata> block with a Creative Commons license URL', () => {
		const dirty = `<svg xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/"><metadata><rdf:RDF><cc:License rdf:about="http://creativecommons.org/licenses/by/4.0/"/></rdf:RDF></metadata></svg>`;
		const issues = findSvgIssues(dirty);
		expect(issues.length).toBeGreaterThan(0);
		expect(issues.some((i) => /metadata/.test(i))).toBe(true);
		expect(issues.some((i) => /creativecommons|off-origin URL/.test(i))).toBe(true);
	});

	it('catches any non-w3.org absolute URL (e.g. an embedded raster or remote ref)', () => {
		expect(findSvgIssues(`<image href="https://cdn.example.com/fox.png"/>`).length).toBeGreaterThan(
			0
		);
	});

	it('confirms the actual committed favicon is clean', async () => {
		const favicon = await readFile('static/favicon.svg', 'utf8');
		expect(findSvgIssues(favicon)).toEqual([]);
	});
});
