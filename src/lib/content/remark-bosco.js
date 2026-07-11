/**
 * remark-bosco — the Markdown authoring layer for Library cross-links and glossary terms.
 *
 * Two author-facing protocols, both resolved at build time inside mdsvex:
 *   - `[text](bosco:category/slug)` — an inline cross-link to another Library topic. Rewritten to the
 *     real prerendered route `/library/category/slug/` after checking the target ships in THIS build.
 *   - `[term](gloss:id)` — a glossary term. Replaced with a `<button class="gloss-term">` carrying the
 *     definition (looked up from the shipping glossary) in a `data-gloss-def` attribute, so a tap
 *     reveals it. A dangling / unreviewed cross-link OR an unknown / unreviewed glossary term fails
 *     the build — the doctrine + offline invariants, enforced at authoring time.
 *
 * Node-loadable ESM `.js` on purpose: this module is imported by `svelte.config.js`, which SvelteKit
 * loads with a raw Node `import()` that cannot transpile TypeScript. It reads the shipping topic set
 * and glossary from the process-global {@link module:catalog} that the content plugin populates.
 *
 * @typedef {{ type: string, url?: string, value?: string, children?: MdNode[] }} MdNode
 */
import { TOPIC_PATH_RE, GLOSS_ID_RE } from './gate.js';
import { requireGate, hasTopic, lookupGloss } from './catalog.js';

const BOSCO = 'bosco:';
const GLOSS = 'gloss:';
/** http(s):// or protocol-relative //host — never allowed inline (the offline invariant). */
const EXTERNAL_RE = /^(?:https?:)?\/\//i;

/**
 * mdast node types that carry a `url` we must validate/rewrite. It's NOT just inline `link` nodes:
 * a reference-style link (`[text][id]` with `[id]: url`) parses to a urless `linkReference` plus a
 * separate `definition` node that actually holds the url, and `image` nodes carry a src `url` too.
 * Missing any of these lets a reference or image `bosco:`/external URL slip past unvalidated.
 * (Inline `gloss:` links are intercepted before this — they never reach {@link rewriteUrl}.)
 */
const URL_NODES = new Set(['link', 'image', 'definition']);

/**
 * @param {string} url  the link's raw URL
 * @param {string} base the deployment base path (kit.paths.base; '' today)
 * @returns {string} the rewritten URL
 */
function rewriteUrl(url, base) {
	if (url.startsWith(GLOSS)) {
		// gloss: is only meaningful as an INLINE link (its visible text becomes the term). Reaching here
		// means it's on an image or a reference-style definition — neither can carry a glossary term.
		throw new Error(
			`"${url}" is only valid as an inline glossary link, e.g. [term](gloss:id) — not on an image ` +
				`or a reference-style definition.`
		);
	}
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
 * Escape a string for a double-quoted HTML attribute that is emitted as RAW HTML *inside a Svelte
 * component*. HTML-escape FIRST (so a literal `&` becomes `&amp;` before we introduce our own
 * entities), THEN brace-escape (`{`/`}` → numeric entities) so Svelte does not try to parse the value
 * as a `{expression}`. Order matters: swapping them would double-escape the `&` in `&#123;`.
 * @param {string} s
 * @returns {string}
 */
function escapeAttr(s) {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/\{/g, '&#123;')
		.replace(/\}/g, '&#125;');
}

/**
 * Flatten a phrasing subtree to its plain text (for the button's accessible name). The visible term
 * may be formatted (`[**brush**](gloss:brush)`), so we walk to collect the text nodes.
 * @param {MdNode[]} nodes
 * @returns {string}
 */
function plainText(nodes) {
	let s = '';
	for (const n of nodes) {
		if (typeof n.value === 'string') s += n.value;
		else if (Array.isArray(n.children)) s += plainText(n.children);
	}
	return s;
}

/**
 * The raw-HTML opening tag for a glossary-term button. The definition is baked into `data-gloss-def`
 * (read at runtime by the toggletip controller via `textContent` — never `innerHTML`, so nothing in a
 * def can inject markup). The accessible name repeats the visible term and flags it as a glossary
 * term so a screen reader announces the affordance.
 * @param {string} id  a validated glossary id
 * @param {string} termText  the visible term's plain text
 * @returns {string}
 */
function glossOpenTag(id, termText) {
	const entry = lookupGloss(id);
	if (!entry) {
		throw new Error(
			`Glossary term "${GLOSS}${id}" has no entry that ships in this build — an unknown or ` +
				`unreviewed term. Add src/glossary/{general,faith}/${id}.md and approve it.`
		);
	}
	const def = escapeAttr(entry.def);
	const label = escapeAttr(`${termText}, glossary term`);
	return `<button type="button" class="gloss-term" data-gloss-def="${def}" aria-label="${label}">`;
}

/** @param {MdNode} node @param {string} base */
function maybeRewrite(node, base) {
	if (URL_NODES.has(node.type) && typeof node.url === 'string') {
		node.url = rewriteUrl(node.url, base);
	}
}

/** @param {MdNode} node @returns {boolean} */
function isGlossLink(node) {
	return node.type === 'link' && typeof node.url === 'string' && node.url.startsWith(GLOSS);
}

/**
 * Walk the tree, validating/rewriting every URL-bearing node and splicing glossary buttons in place.
 * A gloss link is replaced, in its parent's child list, by a raw-HTML `<button>` open tag, the link's
 * ORIGINAL children (so formatting survives), and a `</button>` close tag — the shape proven to
 * round-trip through mdsvex. Everything else keeps the existing in-place URL rewrite.
 * @param {MdNode} node
 * @param {string} base
 */
function walk(node, base) {
	if (!Array.isArray(node.children)) return;
	/** @type {MdNode[]} */
	const out = [];
	for (const child of node.children) {
		if (isGlossLink(child)) {
			const id = /** @type {string} */ (child.url).slice(GLOSS.length);
			if (!GLOSS_ID_RE.test(id)) {
				throw new Error(
					`Invalid glossary link "${child.url}" — an id must look like "gloss:term-id".`
				);
			}
			const kids = child.children ?? [];
			// Still walk the visible children: markdown forbids a nested link, but an image inside
			// (`[![alt](url)](gloss:id)`) could smuggle an external URL past the offline guard.
			for (const gc of kids) {
				maybeRewrite(gc, base);
				walk(gc, base);
			}
			out.push({ type: 'html', value: glossOpenTag(id, plainText(kids)) });
			for (const gc of kids) out.push(gc);
			out.push({ type: 'html', value: '</button>' });
		} else {
			maybeRewrite(child, base);
			walk(child, base);
			out.push(child);
		}
	}
	node.children = out;
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
