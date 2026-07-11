/**
 * Token embedded in every FAKE draft body. It marks the prose as non-shippable placeholder so it can
 * be refused structurally: the provenance guard fails on a `fake`-generated tier that reaches
 * `approved`, AND the existing production content-gate greps built output for this exact string — so
 * filler can never reach production, whether or not its provenance sidecar is intact.
 */
export const FAKE_SENTINEL = 'BOSCO_FAKE_DRAFT_DO_NOT_SHIP';

/**
 * A deterministic, fully-offline stand-in for a language model. It lets the whole pipeline be
 * exercised in tests and dry runs with ZERO network and ZERO API key. Its output is obviously
 * placeholder (and sentinel-marked), never real prose — the README makes clear a `fake`-drafted
 * topic must be regenerated with the real adapter (or hand-written) before the owner approves it.
 *
 * It records every call on `.calls` (in order) so tests can assert the pass sequence — e.g. that
 * Pass A runs before B/C, and that a verbatim topic never reaches a generator at all.
 *
 * @returns {import('../lib/passes.mjs').Generator & { calls: Array<{ pass: string, targetTier: number }> }}
 */
export function makeFakeGenerator() {
	/** @type {Array<{ pass: string, targetTier: number }>} */
	const calls = [];

	/** @type {import('../lib/passes.mjs').Generator} */
	const generate = async (req) => {
		calls.push({ pass: req.pass, targetTier: req.targetTier });
		// The sentinel MUST live in the VISIBLE prose, not an HTML comment: mdsvex/Svelte strip comments
		// from compiled output, so a comment-only sentinel would never reach the built HTML the production
		// content-gate greps — leaving that layer of the fake-approval guard vacuous.
		const markdown =
			`**${FAKE_SENTINEL}** — placeholder ${req.pass}→T${req.targetTier} draft for “${req.topic.title}”. ` +
			`Replace with real prose before review.\n\n` +
			req.source.trim();
		return { markdown, model: 'fake' };
	};

	return Object.assign(generate, { calls });
}
