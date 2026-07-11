import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import matter from 'gray-matter';
import { scanReviewTopics, formatReviewQueue } from './lib/review.mjs';

let root: string;
let contentRoot: string;

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), 'bosco-review-'));
	contentRoot = join(root, 'content');
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

function topic(category: string, slug: string, status: string, kind?: string) {
	const dir = join(contentRoot, category, slug);
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, 'tier-2.md'), 'body');
	writeFileSync(
		join(dir, 'index.md'),
		matter.stringify('notes', {
			title: `T ${slug}`,
			category,
			summary: 's',
			tiers: [2],
			review_status: status,
			sources: [{ title: 'A source' }]
		})
	);
	if (kind) writeFileSync(join(dir, 'provenance.json'), JSON.stringify({ content_kind: kind }));
}

describe('review queue', () => {
	it('lists only non-approved topics by default and omits approved', () => {
		topic('creatures', 'pending-one', 'pending', 'adapted');
		topic('faith', 'a-prayer', 'pending', 'verbatim');
		topic('world', 'shipped', 'approved', 'adapted');

		const rows = scanReviewTopics(contentRoot);
		const out = formatReviewQueue(rows);
		expect(out).toContain('creatures/pending-one');
		expect(out).toContain('faith/a-prayer');
		expect(out).not.toContain('world/shipped');
		// Doctrine rows are badged.
		expect(out).toMatch(/\[DOCTRINE\]/);
	});

	it('includes approved topics with --all', () => {
		topic('world', 'shipped', 'approved', 'adapted');
		const out = formatReviewQueue(scanReviewTopics(contentRoot), { all: true });
		expect(out).toContain('world/shipped');
	});

	it('tolerates a topic with no provenance sidecar (kind unknown, no crash)', () => {
		topic('creatures', 'no-sidecar', 'pending');
		const rows = scanReviewTopics(contentRoot);
		expect(rows[0].kind).toBe('unknown');
		expect(() => formatReviewQueue(rows)).not.toThrow();
	});

	it('reports "nothing pending" when all approved', () => {
		topic('world', 'shipped', 'approved', 'adapted');
		expect(formatReviewQueue(scanReviewTopics(contentRoot))).toMatch(/nothing pending/i);
	});
});
