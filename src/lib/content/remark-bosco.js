/**
 * remark-bosco — the Markdown authoring layer for Library cross-links.
 *
 * Authors write inline cross-links with a `bosco:` protocol, e.g.
 *   `Foxes appear in old [fables](bosco:world/printing-press) …`
 * and this remark plugin (run inside mdsvex, at build time) rewrites the link to the real prerendered
 * route `/library/world/printing-press/` after checking the target actually ships in THIS build — the
 * inline sibling of the frontmatter `related`/See-also `validateCrossLinks`. A dangling or
 * gated-out (in production: unreviewed) target fails the build.
 *
 * Node-loadable ESM `.js` on purpose: this module is imported by `svelte.config.js`, which SvelteKit
 * loads with a raw Node `import()` that cannot transpile TypeScript. It reads the shipping-topic set
 * from the process-global {@link module:catalog} that the content plugin populates.
 *
 * (The `gloss:` glossary protocol and its doctrine gate arrive in PR2b-ii; this plugin only rewrites
 * `bosco:` and rejects external URLs.)
 *
 * @typedef {{ type: string, url?: string, children?: MdNode[] }} MdNode
 */
import { TOPIC_PATH_RE } from './gate.js';
import { requireGate, hasTopic } from './catalog.js';

const BOSCO = 'bosco:';
/** http(s):// or protocol-relative //host — never allowed inline (the offline invariant). */
const EXTERNAL_RE = /^(?:https?:)?\/\//i;

/**
 * @param {string} url  the link's raw URL
 * @param {string} base the deployment base path (kit.paths.base; '' today)
 * @returns {string} the rewritten URL
 */
function rewriteUrl(url, base) {
	if (url.startsWith(BOSCO)) {
		const target = url.slice(BOSCO.length);
		if (!TOPIC_PATH_RE.test(target)) {
			throw new Error(
				`Invalid bosco: cross-link "${url}" — it must look like "bosco:category/slug".`
			);
		}
		if (!hasTopic(target)) {
			throw new Error(
				`bosco: cross-link "${url}" points to a topic that does not ship in this build — a dangling ` +
					`or unreviewed cross-link. Fix the path or approve the target.`
			);
		}
		return `${base}/library/${target}/`;
	}
	if (EXTERNAL_RE.test(url)) {
		throw new Error(
			`External link "${url}" in article prose — Bosco ships zero external links at runtime. ` +
				`External references belong in frontmatter "sources", not inline. (guard:external over ` +
				`build/ is the authoritative check; this is an earlier, clearer authoring-time error.)`
		);
	}
	return url;
}

/**
 * mdast node types that carry a `url` we must validate/rewrite. It's NOT just inline `link` nodes:
 * a reference-style link (`[text][id]` with `[id]: url`) parses to a urless `linkReference` plus a
 * separate `definition` node that actually holds the url, and `image` nodes carry a src `url` too.
 * Missing any of these lets a reference or image `bosco:`/external URL slip past unvalidated.
 */
const URL_NODES = new Set(['link', 'image', 'definition']);

/**
 * @param {MdNode} node
 * @param {string} base
 */
function walk(node, base) {
	if (URL_NODES.has(node.type) && typeof node.url === 'string') {
		node.url = rewriteUrl(node.url, base);
		// Only the URL is touched — a link's children (its visible text, incl. em/strong) and a
		// definition's referencing text are left intact, so mdsvex serializes them normally.
	}
	if (Array.isArray(node.children)) {
		for (const child of node.children) walk(child, base);
	}
}

/**
 * mdsvex remark plugin. Usage: `mdsvex({ remarkPlugins: [boscoRemark({ base: '' })] })`.
 * @param {{ base?: string }} [options]
 */
export default function boscoRemark({ base = '' } = {}) {
	return function attacher() {
		/** @param {MdNode} tree */
		return function transformer(tree) {
			// Fail-closed: the content plugin must have populated the catalog first.
			requireGate();
			walk(tree, base);
		};
	};
}
