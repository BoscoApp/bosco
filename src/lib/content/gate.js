/**
 * The content gate primitive — the ONE source of "may this ship?" and the shape that names a topic.
 *
 * This is deliberately dependency-free ESM `.js` (JSDoc types, checked via tsconfig `checkJs`) so it
 * can be imported by BOTH realms that need it:
 *   - the Vite content plugin (`plugin.ts`), bundled by esbuild, and
 *   - the mdsvex remark plugin (`remark-bosco.js`), which is constructed inside `svelte.config.js` —
 *     a file SvelteKit loads with a raw Node `import()` that CANNOT transpile TypeScript.
 * Keeping the gate primitive TS-free (no zod, no fs) is what lets the remark chain load at all, and
 * makes a second, drifting copy of the publish decision impossible.
 *
 * `schema.ts` re-exports these so existing TS imports (`from './schema'`) keep working.
 */

/** MDX-level review state. The doctrine gate ships ONLY `approved` content to production. */
export const REVIEW_STATUSES = /** @type {readonly ['draft', 'pending', 'approved']} */ ([
	'draft',
	'pending',
	'approved'
]);

/** A topic path (`category/slug`) — the shape of a `related` entry and a `bosco:` cross-link target. */
export const TOPIC_PATH_RE = /^[a-z0-9-]+\/[a-z0-9-]+$/;

/**
 * A glossary term id — the target of an inline `gloss:id` link and the filename stem of a glossary
 * entry (`src/glossary/{general,faith}/<id>.md`). A single flat id namespace (no category), so a
 * `gloss:` link never has to know whether a term is general or doctrinal.
 */
export const GLOSS_ID_RE = /^[a-z0-9-]+$/;

/**
 * The single source of truth for "may this content ship?". Production builds (`preview` = false)
 * include only `approved` content — doctrine never ships unreviewed. Enforced at build time by the
 * content plugin, not at runtime.
 * @param {string} status
 * @param {{ preview: boolean }} opts
 * @returns {boolean}
 */
export function isPublished(status, { preview }) {
	return preview || status === 'approved';
}
