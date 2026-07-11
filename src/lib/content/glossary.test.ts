import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { scanGlossary } from './plugin';

/**
 * The glossary doctrine gate, proven directly (not via a build artifact). `scanGlossary` is the sole
 * place a term's `review_status` decides whether it ships, so exercising it over a temp fixture tree
 * proves the NEGATIVE the remark tests can't: a pending/draft term is genuinely absent from a
 * production scan, and a malformed glossary file fails the build (fail-closed) rather than shipping a
 * half-formed definition.
 */

let root: string;

/** Write `src/glossary/<area>/<id>.md` with the given frontmatter + body under a fresh temp root. */
function writeTerm(area: string, id: string, frontmatter: string, body: string): void {
	const dir = join(root, 'src', 'glossary', area);
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, `${id}.md`), `---\n${frontmatter}\n---\n${body}\n`);
}

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), 'bosco-gloss-'));
});
afterEach(() => {
	rmSync(root, { recursive: true, force: true });
});

describe('scanGlossary (the glossary doctrine gate)', () => {
	it('returns an empty map when there is no glossary directory', () => {
		expect(scanGlossary(root, false).size).toBe(0);
		expect(scanGlossary(root, true).size).toBe(0);
	});

	it('ships only approved terms in production, but all of them in preview', () => {
		writeTerm('general', 'brush', 'review_status: approved', 'A fox tail.');
		writeTerm('general', 'kit', 'review_status: pending', 'A baby fox.');
		writeTerm('general', 'earth', 'review_status: draft', 'A fox den.');

		const prod = scanGlossary(root, false);
		expect([...prod.keys()].sort()).toEqual(['brush']);
		expect(prod.get('brush')?.def).toBe('A fox tail.');

		const preview = scanGlossary(root, true);
		expect([...preview.keys()].sort()).toEqual(['brush', 'earth', 'kit']);
	});

	it('gates a doctrinal faith term the same way — pending faith never ships to production', () => {
		writeTerm('faith', 'grace', 'review_status: pending', 'A gift from God.');
		expect(scanGlossary(root, false).has('grace')).toBe(false);

		const preview = scanGlossary(root, true);
		expect(preview.get('grace')).toMatchObject({ area: 'faith', status: 'pending' });
	});

	it('collapses whitespace in a multi-line definition body', () => {
		writeTerm('general', 'brush', 'review_status: approved', 'A fox tail.\nSoft and   bushy.');
		expect(scanGlossary(root, false).get('brush')?.def).toBe('A fox tail. Soft and bushy.');
	});

	it('throws on a duplicate id across general/ and faith/ (ambiguous, even if one is gated out)', () => {
		writeTerm('general', 'brush', 'review_status: approved', 'A fox tail.');
		writeTerm('faith', 'brush', 'review_status: pending', 'Something else.');
		expect(() => scanGlossary(root, false)).toThrow(/Duplicate glossary id "brush"/);
	});

	it('throws on missing review_status (fail-closed: no default)', () => {
		writeTerm('general', 'brush', 'term: Brush', 'A fox tail.');
		expect(() => scanGlossary(root, false)).toThrow(/Invalid glossary frontmatter/);
	});

	it('throws on an invalid review_status value', () => {
		writeTerm('general', 'brush', 'review_status: shipit', 'A fox tail.');
		expect(() => scanGlossary(root, false)).toThrow(/Invalid glossary frontmatter/);
	});

	it('throws on an empty definition body', () => {
		writeTerm('general', 'brush', 'review_status: approved', '   ');
		expect(() => scanGlossary(root, false)).toThrow(/empty definition/);
	});

	it('throws on a malformed filename id (must be lower kebab-case)', () => {
		writeTerm('general', 'Not_Valid', 'review_status: approved', 'A fox tail.');
		expect(() => scanGlossary(root, false)).toThrow(/Invalid glossary filename/);
	});

	it('ignores an unknown area folder entirely', () => {
		writeTerm('spooky', 'ghost', 'review_status: approved', 'Boo.');
		expect(scanGlossary(root, false).size).toBe(0);
	});
});
