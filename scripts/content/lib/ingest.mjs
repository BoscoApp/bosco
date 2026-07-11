import matter from 'gray-matter';
import { specFrontmatterSchema } from './spec-schema.mjs';

/**
 * @typedef {object} IngestDoc
 * @property {'adapted'|'verbatim'} kind
 * @property {import('./spec-schema.mjs').SpecFrontmatter} meta   Validated spec frontmatter.
 * @property {string|null} source          Adapted only: the raw public-domain source text the passes adapt.
 * @property {Record<number,string>|null} verbatimTiers  Verbatim only: the exact bytes for each declared tier.
 */

/**
 * Parse one `*.topic.md` spec into the structured `IngestDoc` the pipeline runs on. Fail-closed at
 * every step: missing/invalid `content_kind`, an adapted spec with no source body, or a verbatim spec
 * whose body is anything other than complete `## tier-N` / `## all` blocks all throw.
 *
 * @param {string} rawText  The full spec file contents.
 * @param {{ where?: string }} [opts]
 * @returns {IngestDoc}
 */
export function parseSpec(rawText, { where = 'spec' } = {}) {
	const { data, content } = matter(rawText);
	const parsed = specFrontmatterSchema.safeParse(data);
	if (!parsed.success) {
		throw new Error(`Invalid spec frontmatter in ${where}:\n${parsed.error.message}`);
	}
	const meta = parsed.data;
	const body = content.trim();

	if (meta.content_kind === 'verbatim') {
		return {
			kind: 'verbatim',
			meta,
			source: null,
			verbatimTiers: parseVerbatimBlocks(body, meta.tiers, where)
		};
	}

	// adapted
	if (!body) {
		throw new Error(
			`Adapted spec ${where} has an empty body — it needs the raw public-domain source text ` +
				`for Pass A to adapt into Tier 2.`
		);
	}
	return { kind: 'adapted', meta, source: body, verbatimTiers: null };
}

/**
 * A verbatim spec's body must consist ONLY of `## tier-1|2|3` blocks (one per declared tier) or a
 * single `## all` block that maps to every declared tier (the common prayer case). ANY text outside a
 * block is a fatal error — this is what makes doctrine structurally un-adaptable: there is no free body
 * a pass could rewrite. Returns `{ [tier]: exactText }` for exactly the declared tiers.
 *
 * @param {string} body
 * @param {number[]} tiers
 * @param {string} where
 * @returns {Record<number,string>}
 */
function parseVerbatimBlocks(body, tiers, where) {
	const lines = body.split('\n');
	/** @type {Record<string,string[]>} */
	const blocks = {};
	const preamble = [];
	let current = null;

	for (const line of lines) {
		const heading = /^##\s+(all|tier-([123]))\s*$/.exec(line.trim());
		if (heading) {
			current = heading[1];
			if (blocks[current]) throw new Error(`${where}: duplicate "## ${current}" block.`);
			blocks[current] = [];
		} else if (current) {
			blocks[current].push(line);
		} else if (line.trim()) {
			preamble.push(line.trim());
		}
	}

	if (preamble.length) {
		throw new Error(
			`${where}: a verbatim spec may contain ONLY "## tier-N" or "## all" blocks — found free ` +
				`text ("${preamble[0].slice(0, 48)}…"). Doctrine is never adapted, so it has no adaptable body.`
		);
	}

	const labels = Object.keys(blocks);
	if (!labels.length) {
		throw new Error(
			`${where}: a verbatim spec must supply its exact text in "## tier-N" or "## all" block(s).`
		);
	}

	const hasAll = labels.includes('all');
	if (hasAll && labels.length > 1) {
		throw new Error(`${where}: "## all" cannot be combined with per-tier blocks.`);
	}
	if (!hasAll) {
		for (const label of labels) {
			const tier = Number(label.slice('tier-'.length));
			if (!tiers.includes(tier)) {
				throw new Error(
					`${where}: "## ${label}" is not a declared tier (tiers: ${tiers.join(', ')}).`
				);
			}
		}
	}

	/** @type {Record<number,string>} */
	const out = {};
	for (const tier of tiers) {
		const label = hasAll ? 'all' : `tier-${tier}`;
		if (!blocks[label]) {
			throw new Error(`${where}: missing "## tier-${tier}" block for declared tier ${tier}.`);
		}
		const text = blocks[label].join('\n').trim();
		if (!text) throw new Error(`${where}: the "## ${label}" block is empty.`);
		out[tier] = text;
	}
	return out;
}
