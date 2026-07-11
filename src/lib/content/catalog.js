/**
 * The build-time content catalog — a passive, process-global store the content plugin populates and
 * the remark plugin reads.
 *
 * Why globalThis? The plugin (`plugin.ts`) is imported by `vite.config.ts` and esbuild-INLINES it
 * into the Vite config bundle, while the remark plugin (`remark-bosco.js`) is imported by
 * `svelte.config.js`, which Node loads from disk. Those are two DIFFERENT module instances of any
 * shared file, so a plain module-level variable written by one is invisible to the other. The one
 * object both instances genuinely share is `globalThis`; a `Symbol.for` key keeps it collision-proof.
 *
 * This module does NO scanning or validation — `plugin.ts` is the sole scanner and pushes the already
 * gated shipping set in here, so what remark validates against is byte-identical to what ships.
 */

const KEY = Symbol.for('bosco.content.catalog');

/**
 * @typedef {{ preview: boolean }} Gate
 * @typedef {{ gate: Gate | null, topicPaths: Set<string> }} Store
 */

/** @returns {Store} */
function store() {
	let s = /** @type {Record<symbol, Store>} */ (/** @type {unknown} */ (globalThis))[KEY];
	if (!s) {
		s = { gate: null, topicPaths: new Set() };
		/** @type {Record<symbol, Store>} */ (/** @type {unknown} */ (globalThis))[KEY] = s;
	}
	return s;
}

/**
 * Record whether this build includes non-approved content. Called once by the plugin's
 * `configResolved`, before any Markdown is transformed.
 * @param {boolean} preview
 */
export function setGate(preview) {
	store().gate = { preview: Boolean(preview) };
}

/**
 * Assert the catalog was populated before the remark plugin ran. Fail-closed: if the plugin's
 * `configResolved` hasn't run (a build-ordering bug), throw rather than validate against an empty
 * catalog and silently pass or mis-report links.
 * @returns {Gate}
 */
export function requireGate() {
	const g = store().gate;
	if (g === null) {
		throw new Error(
			'bosco content catalog is not initialised — the content plugin must run before the remark ' +
				'plugin transforms Markdown. This is a build-ordering bug, not a content error.'
		);
	}
	return g;
}

/**
 * Replace the set of topic paths (`category/slug`) that ship in this build.
 * @param {Iterable<string>} paths
 */
export function setTopicPaths(paths) {
	store().topicPaths = new Set(paths);
}

/**
 * Does a topic ship in this build? (In production the set is gated to `approved`, so this enforces
 * approved-target cross-links.)
 * @param {string} path
 * @returns {boolean}
 */
export function hasTopic(path) {
	return store().topicPaths.has(path);
}

/** Clear the catalog (HMR): the plugin re-scans and re-populates immediately after. */
export function invalidate() {
	const s = store();
	s.gate = null;
	s.topicPaths = new Set();
}
