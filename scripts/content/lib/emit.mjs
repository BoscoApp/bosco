import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { canonicalize } from './canonicalize.mjs';
import {
	buildSidecar,
	readAllSidecars,
	renderCreditsBlock,
	spliceCreditsBlock
} from './provenance.mjs';

/**
 * Write one topic folder in the exact shape `plugin.ts` scans: `tier-N.md` bodies, a `provenance.json`
 * sidecar, and an `index.md` whose frontmatter is born `review_status: pending` (rule 3 — nothing the
 * tool emits is ever pre-approved; only the owner flips a topic to `approved`).
 *
 * WRITE ORDER IS LOAD-BEARING: tier bodies and the sidecar are written FIRST, `index.md` LAST. The
 * content plugin skips any folder lacking `index.md`, so if a (real-adapter) generation crashes
 * mid-run the half-written folder is inert to the build rather than a "missing tier-N.md" build break.
 *
 * @param {import('./passes.mjs').PipelineResult} pipelineResult
 * @param {import('./ingest.mjs').IngestDoc} ingest
 * @param {{ contentRoot: string, specPath: string, date: string }} opts
 * @returns {Promise<{ topicDir: string, wrote: string[] }>}
 */
export async function emitTopic(pipelineResult, ingest, { contentRoot, specPath, date }) {
	const { category, slug } = ingest.meta;
	const topicDir = join(contentRoot, category, slug);
	mkdirSync(topicDir, { recursive: true });

	const wrote = [];

	// 1) Tier bodies (canonicalized so a verbatim body's on-disk bytes match its recorded sha).
	for (const tier of ingest.meta.tiers) {
		const rec = pipelineResult.tiers[tier];
		if (!rec)
			throw new Error(
				`Pipeline produced no body for declared tier ${tier} of ${category}/${slug}.`
			);
		const file = join(topicDir, `tier-${tier}.md`);
		writeFileSync(file, canonicalize(rec.body));
		wrote.push(file);
	}

	// 2) Provenance sidecar (inert to the app; read by the guard, the review queue, and CREDITS).
	const sidecar = await buildSidecar({ ingest, pipelineResult, specPath, date });
	const sidecarPath = join(topicDir, 'provenance.json');
	writeFileSync(sidecarPath, JSON.stringify(sidecar, null, '\t') + '\n');
	wrote.push(sidecarPath);

	// 3) index.md LAST — its presence is what makes the folder "real" to the build.
	const frontmatter = buildFrontmatter(ingest);
	const notes = `Shared notes for ${ingest.meta.title}. The reading-tier bodies live in \`tier-1.md\` … \`tier-3.md\`.`;
	const indexPath = join(topicDir, 'index.md');
	writeFileSync(indexPath, matter.stringify(`\n${notes}\n`, frontmatter));
	wrote.push(indexPath);

	return { topicDir, wrote };
}

/**
 * The `index.md` frontmatter object. `review_status` is HARDCODED to `pending` with no override — the
 * emit path cannot be asked to write an approved topic.
 */
function buildFrontmatter(ingest) {
	const m = ingest.meta;
	/** @type {Record<string, unknown>} */
	const fm = {
		title: m.title,
		category: m.category,
		summary: m.summary,
		tiers: m.tiers,
		review_status: 'pending'
	};
	if (m.default_tier !== undefined) fm.default_tier = m.default_tier;
	if (m.sources.length) fm.sources = m.sources;
	if (m.related.length) fm.related = m.related;
	if (m.observance_id) fm.observance_id = m.observance_id;
	return fm;
}

/**
 * Regenerate the CREDITS `## Content` block from the sidecars under a content root. Advisory: run via
 * `pnpm credits:content` after generating a topic; it is deliberately NOT a CI gate (that would fight
 * Prettier over the managed region). Returns the new CREDITS text and whether it changed on disk.
 *
 * @param {{ creditsPath: string, contentRoot: string }} opts
 * @param {{ check?: boolean }} [flags]
 * @returns {{ changed: boolean, text: string }}
 */
export function refreshCredits({ creditsPath, contentRoot }, { check = false } = {}) {
	if (!existsSync(creditsPath)) throw new Error(`CREDITS file not found: ${creditsPath}`);
	const current = readFileSync(creditsPath, 'utf8');
	const block = renderCreditsBlock(readAllSidecars(contentRoot));
	const next = spliceCreditsBlock(current, block);
	const changed = next !== current;
	if (changed && !check) writeFileSync(creditsPath, next);
	return { changed, text: next };
}
