import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

/**
 * Scan committed content into the owner's review worklist: every topic the production gate would
 * EXCLUDE (review_status !== 'approved'), joined with its provenance. This is the doctrinal reviewer's
 * primary queue; it never changes anything (the gate is the owner flipping review_status to approved).
 *
 * @param {string} contentRoot
 * @returns {Array<{ path: string, title: string, status: string, tiers: number[], kind: string, isDoctrine: boolean, sources: string, indexPath: string, tierFiles: string[] }>}
 */
export function scanReviewTopics(contentRoot) {
	const rows = [];
	if (!existsSync(contentRoot)) return rows;

	for (const cat of readdirSync(contentRoot, { withFileTypes: true })) {
		if (!cat.isDirectory()) continue;
		const catDir = join(contentRoot, cat.name);
		for (const topic of readdirSync(catDir, { withFileTypes: true })) {
			if (!topic.isDirectory()) continue;
			const topicDir = join(catDir, topic.name);
			const indexPath = join(topicDir, 'index.md');
			if (!existsSync(indexPath)) continue;

			const fm = matter(readFileSync(indexPath, 'utf8')).data;
			const status = fm.review_status ?? 'unknown';
			const tiers = Array.isArray(fm.tiers) ? [...fm.tiers].sort((a, b) => a - b) : [];

			const sidecarPath = join(topicDir, 'provenance.json');
			// Tolerate a missing sidecar (the common non-doctrine case) — kind falls back to unknown.
			let kind = 'unknown';
			if (existsSync(sidecarPath)) {
				try {
					kind = JSON.parse(readFileSync(sidecarPath, 'utf8')).content_kind ?? 'unknown';
				} catch {
					kind = 'unreadable';
				}
			}

			const sources = Array.isArray(fm.sources)
				? fm.sources
						.map((s) => s.title)
						.filter(Boolean)
						.join('; ')
				: '';

			rows.push({
				path: `${cat.name}/${topic.name}`,
				title: fm.title ?? topic.name,
				status,
				tiers,
				kind,
				isDoctrine: kind === 'verbatim',
				sources: sources || '—',
				indexPath,
				tierFiles: tiers.map((t) => join(topicDir, `tier-${t}.md`))
			});
		}
	}
	return rows.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Format the review queue as a deterministic, aligned plain-text report. By default it lists only
 * non-approved topics (what the production gate excludes); `--all` includes approved. Doctrine
 * (verbatim) rows are badged `[DOCTRINE]` and print their tier-body paths so the human can open and
 * read the ACTUAL bytes — the hash guard proves non-tampering, not doctrinal fidelity, so the real
 * check is a person reading the text.
 *
 * @param {ReturnType<typeof scanReviewTopics>} topics
 * @param {{ all?: boolean, kind?: string, showPaths?: boolean }} [opts]
 * @returns {string}
 */
export function formatReviewQueue(topics, { all = false, kind, showPaths = false } = {}) {
	let rows = all ? topics : topics.filter((t) => t.status !== 'approved');
	if (kind) rows = rows.filter((t) => t.kind === kind);

	if (!rows.length) return 'Review queue: nothing pending. ✓';

	const lines = [];
	const col = (s, w) => String(s).padEnd(w);
	lines.push(col('PATH', 26) + col('KIND', 14) + col('TIERS', 8) + col('STATUS', 10) + 'SOURCES');
	for (const t of rows) {
		const kindCell = t.isDoctrine ? '[DOCTRINE]' : t.kind;
		lines.push(
			col(t.path, 26) +
				col(kindCell, 14) +
				col(t.tiers.join(',') || '—', 8) +
				col(t.status, 10) +
				t.sources
		);
		if (showPaths || t.isDoctrine) {
			for (const f of t.tierFiles) lines.push('    ' + f);
		}
	}

	const doctrine = rows.filter((t) => t.isDoctrine).length;
	const adapted = rows.filter((t) => t.kind === 'adapted').length;
	lines.push('');
	lines.push(
		`${rows.length} topic(s): ${doctrine} doctrine/verbatim, ${adapted} adapted, ` +
			`${rows.length - doctrine - adapted} other. Approve by setting review_status: approved.`
	);
	return lines.join('\n');
}
