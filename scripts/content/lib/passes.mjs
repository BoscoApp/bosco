/**
 * The three adaptation passes and the doctrine-safe fork.
 *
 * Adapted (story/fact) topics run A: source→Tier 2, then B: Tier 2→Tier 1 and C: Tier 2→Tier 3.
 * Verbatim (doctrine) topics run NONE of them — they are byte-copied. The two paths are DELIBERATELY
 * different-arity functions and `runPipeline` forks once on `ingest.kind`: `copyVerbatim` takes no
 * generator parameter, so a generator is not even in the lexical scope of the verbatim path. Adapting
 * doctrine is therefore not a rule the code checks — it is a code path that does not exist.
 */

/** @typedef {'A'|'B'|'C'} Pass */
/** Which reading tier each pass targets. A is the pivot (source→Explorer); B/C read A's output. */
export const PASS_TIER = { A: 2, B: 1, C: 3 };

/**
 * @typedef {object} GenRequest
 * @property {Pass} pass
 * @property {1|2|3} targetTier
 * @property {string} source            Text to adapt (raw source for A; the Tier-2 body for B/C).
 * @property {{ title: string, category: string, slug: string, summary: string }} topic
 * @property {string} model
 */
/** @typedef {{ markdown: string, model: string }} GenResult */
/** @callback Generator @param {GenRequest} req @returns {Promise<GenResult>} */

/**
 * @typedef {object} TierRecord
 * @property {string} body
 * @property {'adapted'|'verbatim'} method
 * @property {Pass} [pass]        Adapted only.
 * @property {string} [generator] Adapted only: 'fake' | 'claude'.
 * @property {string} [model]     Adapted only.
 * @property {string} [date]      Adapted only (injected; never read from the clock here).
 */
/** @typedef {{ tiers: Record<number,TierRecord> }} PipelineResult */

/**
 * Run the pipeline for one ingested topic. Forks ONCE on kind. This is the only place kind is
 * branched on; everything downstream (emit, provenance) consumes the uniform `PipelineResult`.
 *
 * @param {import('./ingest.mjs').IngestDoc} ingest
 * @param {Generator} generator   Used ONLY for adapted topics. Never touched for verbatim.
 * @param {{ model: string, date: string }} ctx
 * @returns {Promise<PipelineResult>}
 */
export async function runPipeline(ingest, generator, ctx) {
	return ingest.kind === 'verbatim'
		? copyVerbatim(ingest)
		: runAdaptedPasses(ingest, generator, ctx);
}

/**
 * Adapted path: A (source→T2) first, then B (T2→T1) and C (T2→T3) off A's output. Tier 2 is always
 * computed as the pivot, but a tier is EMITTED only if the topic declares it.
 *
 * @param {import('./ingest.mjs').IngestDoc} ingest
 * @param {Generator} generator
 * @param {{ model: string, date: string }} ctx
 * @returns {Promise<PipelineResult>}
 */
export async function runAdaptedPasses(ingest, generator, { model, date }) {
	if (ingest.kind !== 'adapted') {
		throw new Error(
			`runAdaptedPasses received a ${ingest.kind} topic — doctrine must not be adapted.`
		);
	}
	const declared = new Set(ingest.meta.tiers);
	const topic = {
		title: ingest.meta.title,
		category: ingest.meta.category,
		slug: ingest.meta.slug,
		summary: ingest.meta.summary
	};

	const runPass = async (/** @type {Pass} */ pass, /** @type {string} */ source) => {
		const res = await generator({ pass, targetTier: PASS_TIER[pass], source, topic, model });
		return res;
	};

	// A is the pivot and always runs (B/C consume its output), even if T2 itself is not declared.
	const a = await runPass('A', ingest.source ?? '');
	/** @type {Record<number,TierRecord>} */
	const tiers = {};
	const record = (/** @type {Pass} */ pass, /** @type {GenResult} */ res) => {
		tiers[PASS_TIER[pass]] = {
			body: res.markdown,
			method: 'adapted',
			pass,
			generator: providerOf(res.model),
			model: res.model,
			date
		};
	};

	if (declared.has(2)) record('A', a);
	if (declared.has(1)) record('B', await runPass('B', a.markdown));
	if (declared.has(3)) record('C', await runPass('C', a.markdown));

	return { tiers };
}

/**
 * Verbatim path: byte-copy each declared tier's exact text. Takes NO generator — the whole point.
 * `.length === 1` (arity) is asserted in tests as a canary against anyone widening this signature.
 *
 * @param {import('./ingest.mjs').IngestDoc} ingest
 * @returns {PipelineResult}
 */
export function copyVerbatim(ingest) {
	if (ingest.kind !== 'verbatim' || !ingest.verbatimTiers) {
		throw new Error('copyVerbatim requires a verbatim topic with explicit per-tier text.');
	}
	/** @type {Record<number,TierRecord>} */
	const tiers = {};
	for (const [tier, body] of Object.entries(ingest.verbatimTiers)) {
		tiers[Number(tier)] = { body, method: 'verbatim' };
	}
	return { tiers };
}

/** Map a returned model id to its provider label for provenance. */
function providerOf(model) {
	return model === 'fake' ? 'fake' : 'claude';
}
