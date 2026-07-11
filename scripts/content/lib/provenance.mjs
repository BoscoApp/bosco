import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sha256 } from './canonicalize.mjs';

/** Stamped into every sidecar so the origin tool + format version is on record. */
export const TOOL_ID = 'content-pipeline@1';

/** The managed region in CREDITS.md, refreshed by `pnpm credits:content` (advisory — not CI-gated). */
export const CREDITS_BEGIN =
	'<!-- content:begin (managed by `pnpm credits:content`; do not edit by hand) -->';
export const CREDITS_END = '<!-- content:end -->';

/**
 * @typedef {object} Sidecar
 * @property {string} topic          `category/slug`.
 * @property {'adapted'|'verbatim'} content_kind
 * @property {string} spec           Repo-relative path to the source spec.
 * @property {string} tool
 * @property {string} generatedAt    ISO date (injected; never read from the clock in pure code).
 * @property {Array<{ title: string, license?: string }>} sources
 * @property {Record<string, object>} tiers   Per-tier provenance (see below).
 */

/**
 * Build the provenance sidecar for one emitted topic. Verbatim tiers are FROZEN with a SHA-256 of
 * their exact bytes (the guard re-checks it); adapted tiers record the pass/generator/model/date and
 * carry NO sha (the owner edits adapted prose freely during review, so a hash would just go stale).
 *
 * This is FACTUAL provenance — source + the fact a tier was AI-adapted + which model/pass/date. It is
 * explicitly NOT a vanity credit: it never becomes a git co-author, a "Generated with…" line, or text
 * inside `index.md`; it lives only in this machine-readable sidecar and the human CREDITS list.
 *
 * @param {{ ingest: import('./ingest.mjs').IngestDoc, pipelineResult: import('./passes.mjs').PipelineResult, specPath: string, date: string }} args
 * @returns {Promise<Sidecar>}
 */
export async function buildSidecar({ ingest, pipelineResult, specPath, date }) {
	/** @type {Record<string, object>} */
	const tiers = {};
	for (const [tier, rec] of Object.entries(pipelineResult.tiers)) {
		if (rec.method === 'verbatim') {
			tiers[tier] = { method: 'verbatim', sha256: await sha256(rec.body) };
		} else {
			tiers[tier] = {
				method: 'adapted',
				pass: rec.pass,
				generator: rec.generator,
				model: rec.model,
				date: rec.date
			};
		}
	}
	return {
		topic: `${ingest.meta.category}/${ingest.meta.slug}`,
		content_kind: ingest.kind,
		spec: specPath,
		tool: TOOL_ID,
		generatedAt: date,
		sources: ingest.meta.sources.map((s) => ({ title: s.title, license: s.license })),
		tiers
	};
}

/**
 * Read every `provenance.json` sidecar under a content root, in stable path order.
 * @param {string} contentRoot
 * @returns {Sidecar[]}
 */
export function readAllSidecars(contentRoot) {
	/** @type {Sidecar[]} */
	const out = [];
	if (!existsSync(contentRoot)) return out;
	for (const cat of readdirSync(contentRoot, { withFileTypes: true })) {
		if (!cat.isDirectory()) continue;
		const catDir = join(contentRoot, cat.name);
		for (const topic of readdirSync(catDir, { withFileTypes: true })) {
			if (!topic.isDirectory()) continue;
			const p = join(catDir, topic.name, 'provenance.json');
			if (existsSync(p)) out.push(JSON.parse(readFileSync(p, 'utf8')));
		}
	}
	return out.sort((a, b) => a.topic.localeCompare(b.topic));
}

/**
 * Render the CREDITS `## Content` body as a prettier-stable bullet list (NOT a table — Prettier
 * re-pads markdown tables, which would fight `credits:content`; bullets it leaves alone). One line per
 * tool-emitted topic, stating the source(s) and whether tiers are verbatim or AI-adapted (with model +
 * passes). No AI vanity line.
 *
 * @param {Sidecar[]} sidecars
 * @returns {string}
 */
export function renderCreditsBlock(sidecars) {
	if (!sidecars.length) return '_No tool-emitted topics yet._';
	return [...sidecars]
		.sort((a, b) => a.topic.localeCompare(b.topic))
		.map(formatRow)
		.join('\n');
}

function formatRow(s) {
	const tierList = Object.keys(s.tiers)
		.map(Number)
		.sort((a, b) => a - b)
		.join(', ');
	const sources =
		s.sources
			.map((src) => (src.license ? `${src.title} (${src.license})` : src.title))
			.join('; ') || '—';
	if (s.content_kind === 'verbatim') {
		return `- **${s.topic}** — Verbatim (public domain), tiers ${tierList}. Source: ${sources}.`;
	}
	const passes = [
		...new Set(
			Object.values(s.tiers)
				.map((t) => t.pass)
				.filter(Boolean)
		)
	].sort();
	const model = Object.values(s.tiers).find((t) => t.model)?.model ?? 'unknown model';
	const label = passes.length > 1 ? 'passes' : 'pass';
	return `- **${s.topic}** — AI-adapted (${model}, ${label} ${passes.join('/')}), tiers ${tierList}. Source: ${sources}.`;
}

/**
 * Replace the managed region of CREDITS.md with a freshly-rendered block. Throws if the markers are
 * missing (so we never silently append to the wrong place).
 *
 * @param {string} creditsText
 * @param {string} block
 * @returns {string}
 */
export function spliceCreditsBlock(creditsText, block) {
	const begin = creditsText.indexOf(CREDITS_BEGIN);
	const end = creditsText.indexOf(CREDITS_END);
	if (begin === -1 || end === -1) {
		throw new Error('CREDITS.md is missing the content:begin / content:end markers.');
	}
	if (end < begin) throw new Error('CREDITS.md content markers are out of order.');
	const before = creditsText.slice(0, begin + CREDITS_BEGIN.length);
	const after = creditsText.slice(end);
	return `${before}\n\n${block}\n\n${after}`;
}
