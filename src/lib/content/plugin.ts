import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import type { ModuleNode, Plugin } from 'vite';
import {
	topicFrontmatterSchema,
	glossaryEntryFrontmatterSchema,
	isPublished,
	pickDefaultTier,
	validateCrossLinks,
	GLOSS_ID_RE,
	type TopicMeta
} from './schema';
import { setGate, setTopicPaths, setGlossary, invalidate } from './catalog.js';

const VIRTUAL_ID = 'virtual:bosco/content';
const RESOLVED_ID = '\0' + VIRTUAL_ID;
// A companion module whose default-tier bodies are STATIC imports (not lazy). Rendering one of
// these at prerender time bakes real prose into the static HTML — the offline/no-JS/search floor.
const EAGER_ID = 'virtual:bosco/content-eager';
const EAGER_RESOLVED_ID = '\0' + EAGER_ID;
const CONTENT_ROOT = 'src/content';
const GLOSSARY_ROOT = 'src/glossary';

/**
 * Build-time content loader + doctrine gate.
 *
 * Reads every `src/content/<category>/<slug>/index.md`, validates its frontmatter against the
 * Zod schema (an invalid topic fails the build), and emits a virtual module `virtual:bosco/content`
 * exporting the published topics with lazy per-tier loaders.
 *
 * The gate is applied HERE, at build time: in a production build, non-`approved` topics are never
 * written into the virtual module, so their metadata and their tier bodies never enter the bundle.
 * Pending doctrine is excluded from production output entirely — not merely hidden at runtime.
 *
 * Preview (dev server, or `CONTENT_PREVIEW=1` build) includes everything so authors can review.
 */
export function boscoContent(): Plugin {
	let root = process.cwd();
	let preview = false;

	// Push the gate flag + the shipping topic paths + the shipping glossary into the process-global
	// catalog, so the remark plugin (a separate module realm loaded by svelte.config.js) validates
	// `bosco:` cross-links and `gloss:` terms against EXACTLY the set this build ships.
	function populateCatalog() {
		setGate(preview);
		setTopicPaths(scan(root, preview).map((p) => p.meta.path));
		setGlossary(scanGlossary(root, preview));
	}

	return {
		name: 'bosco-content',

		configResolved(config) {
			root = config.root;
			// Preview (include non-approved) in dev, tests, and explicit preview builds.
			// Production builds gate to approved-only.
			preview =
				config.command === 'serve' ||
				process.env.CONTENT_PREVIEW === '1' ||
				Boolean(process.env.VITEST);
			// Runs before any Markdown is transformed, so the catalog is ready when remark reads it.
			populateCatalog();
		},

		resolveId(id) {
			if (id === VIRTUAL_ID) return RESOLVED_ID;
			if (id === EAGER_ID) return EAGER_RESOLVED_ID;
		},

		load(id) {
			if (id === RESOLVED_ID) return mainModule(scan(root, preview));
			if (id === EAGER_RESOLVED_ID) return eagerModule(scan(root, preview));
		},

		handleHotUpdate({ file, server }) {
			const norm = file.replace(/\\/g, '/');
			if (!norm.includes('/src/content/') && !norm.includes('/src/glossary/')) return;
			// A content OR glossary edit can add/remove a topic/term (changing which `bosco:` targets and
			// `gloss:` terms are valid), and its effect is baked into already-compiled article HTML.
			// Re-scan, re-populate the catalog, and invalidate the virtual modules AND every compiled
			// content `.md` so remark re-validates against the new set.
			resetScan();
			invalidate();
			populateCatalog();
			const graph = server.moduleGraph;
			const mods = new Set<ModuleNode>();
			for (const rid of [RESOLVED_ID, EAGER_RESOLVED_ID]) {
				const m = graph.getModuleById(rid);
				if (m) mods.add(m);
			}
			for (const m of graph.idToModuleMap.values()) {
				if (
					m.file &&
					m.file.replace(/\\/g, '/').includes('/src/content/') &&
					m.file.endsWith('.md')
				) {
					mods.add(m);
				}
			}
			for (const m of mods) graph.invalidateModule(m);
			server.ws.send({ type: 'full-reload' });
			return [];
		}
	};
}

// One filesystem scan per (root, preview), memoized so configResolved and both virtual-module loads
// share it; `resetScan()` drops it on HMR.
let scanCache: { root: string; preview: boolean; value: Published[] } | null = null;
function scan(root: string, preview: boolean): Published[] {
	if (scanCache && scanCache.root === root && scanCache.preview === preview) return scanCache.value;
	const value = scanPublished(root, preview);
	scanCache = { root, preview, value };
	return value;
}
function resetScan(): void {
	scanCache = null;
}

interface Published {
	meta: TopicMeta;
	category: string;
	slug: string;
	tiers: number[];
	defaultTier: number;
}

/** Read + gate every topic once, returning the published set both virtual modules are built from. */
function scanPublished(root: string, preview: boolean): Published[] {
	const contentDir = join(root, CONTENT_ROOT);
	if (!existsSync(contentDir)) return [];

	const published: Published[] = [];

	for (const cat of readdirSync(contentDir, { withFileTypes: true })) {
		if (!cat.isDirectory()) continue;
		const catDir = join(contentDir, cat.name);

		for (const topic of readdirSync(catDir, { withFileTypes: true })) {
			if (!topic.isDirectory()) continue;
			const topicDir = join(catDir, topic.name);
			const indexPath = join(topicDir, 'index.md');
			if (!existsSync(indexPath)) continue;

			const where = `${cat.name}/${topic.name}/index.md`;
			const { data } = matter(readFileSync(indexPath, 'utf8'));
			const parsed = topicFrontmatterSchema.safeParse(data);
			if (!parsed.success) {
				throw new Error(`Invalid content frontmatter in ${where}:\n${parsed.error.message}`);
			}
			const fm = parsed.data;

			if (fm.category !== cat.name) {
				throw new Error(
					`Category "${fm.category}" does not match folder "${cat.name}" in ${where}`
				);
			}
			if (!isPublished(fm.review_status, { preview })) continue;

			for (const t of fm.tiers) {
				if (!existsSync(join(topicDir, `tier-${t}.md`))) {
					throw new Error(`Missing tier-${t}.md for ${cat.name}/${topic.name} (declared in tiers)`);
				}
			}

			published.push({
				meta: {
					...fm,
					slug: topic.name,
					path: `${cat.name}/${topic.name}`,
					defaultTier: pickDefaultTier(fm.tiers, fm.default_tier)
				},
				category: cat.name,
				slug: topic.name,
				tiers: fm.tiers,
				defaultTier: pickDefaultTier(fm.tiers, fm.default_tier)
			});
		}
	}

	published.sort((a, b) => a.meta.path.localeCompare(b.meta.path));

	// Every "See also" link must resolve to another topic in THIS build (the gated set), so a
	// production link can never dangle or point at unreviewed content. Fails the build otherwise.
	validateCrossLinks(published.map((p) => ({ path: p.meta.path, related: p.meta.related })));

	return published;
}

export interface GlossEntry {
	def: string;
	area: string;
	status: string;
}

/** The glossary areas — `faith/` is doctrine (owner-reviewed via CODEOWNERS), `general/` is not. */
const GLOSSARY_AREAS = ['general', 'faith'] as const;

/**
 * Read + gate every glossary term once, returning the published `id → entry` map the remark plugin
 * looks `gloss:` links up against. Terms live one-per-file at `src/glossary/<area>/<id>.md`: the
 * frontmatter carries the (required) `review_status`, the body is the plain-text definition.
 *
 * The gate runs HERE, exactly like topics: in a production build a non-`approved` term is never put in
 * the map, so a `gloss:` link to it fails the build instead of shipping an unreviewed definition. A
 * malformed file (bad id, invalid frontmatter, empty body, duplicate id) fails the build too —
 * fail-closed. Exported so the doctrine gate can be proven directly in a unit test.
 */
export function scanGlossary(root: string, preview: boolean): Map<string, GlossEntry> {
	const map = new Map<string, GlossEntry>();
	const glossDir = join(root, GLOSSARY_ROOT);
	if (!existsSync(glossDir)) return map;

	// Every id seen across ALL areas/statuses, so two files claiming the same id is always an error —
	// ambiguous even if the gate would drop one of them in this particular build.
	const seen = new Set<string>();

	for (const area of GLOSSARY_AREAS) {
		const areaDir = join(glossDir, area);
		if (!existsSync(areaDir)) continue;

		for (const file of readdirSync(areaDir, { withFileTypes: true })) {
			if (!file.isFile() || !file.name.endsWith('.md')) continue;
			const id = file.name.slice(0, -'.md'.length);
			const where = `${GLOSSARY_ROOT}/${area}/${file.name}`;

			if (!GLOSS_ID_RE.test(id)) {
				throw new Error(`Invalid glossary filename ${where} — the id must look like "term-id.md".`);
			}
			if (seen.has(id)) {
				throw new Error(
					`Duplicate glossary id "${id}" (${where}) — term ids must be unique across general/ and faith/.`
				);
			}
			seen.add(id);

			const { data, content } = matter(readFileSync(join(areaDir, file.name), 'utf8'));
			const parsed = glossaryEntryFrontmatterSchema.safeParse(data);
			if (!parsed.success) {
				throw new Error(`Invalid glossary frontmatter in ${where}:\n${parsed.error.message}`);
			}
			const def = content.trim().replace(/\s+/g, ' ');
			if (!def) {
				throw new Error(`Glossary entry ${where} has an empty definition (the file body).`);
			}

			if (!isPublished(parsed.data.review_status, { preview })) continue;
			map.set(id, { def, area, status: parsed.data.review_status });
		}
	}

	return map;
}

/**
 * The full catalogue: metadata + lazy per-tier loaders (one dynamic import each). The DEFAULT tier
 * is deliberately omitted here — it ships pre-resolved via `virtual:bosco/content-eager` (so its
 * prose prerenders), and rendering it through a dynamic import too would force it out of code-split
 * chunks. Callers render the default tier from the eager module; the loaders cover the rest.
 */
function mainModule(published: Published[]): string {
	const entries = published.map(({ meta, category, slug, tiers, defaultTier }) => {
		const loaders = tiers
			.filter((t) => t !== defaultTier)
			.map(
				(t) =>
					`${t}: () => import(${JSON.stringify(`/src/content/${category}/${slug}/tier-${t}.md`)})`
			)
			.join(', ');
		return `\t{ ...${JSON.stringify(meta)}, loaders: { ${loaders} } }`;
	});
	return `// Generated by the bosco-content plugin. Do not edit.\nexport const topics = [\n${entries.join(',\n')}\n];\n`;
}

/**
 * The default-tier bodies as STATIC imports, keyed by topic path. Because the imports are static
 * and gated (only published topics appear), rendering `eager[path].component` at prerender time
 * emits real HTML prose — and pending topics' bodies never enter the production bundle.
 */
function eagerModule(published: Published[]): string {
	const imports: string[] = [];
	const entries: string[] = [];
	published.forEach(({ category, slug, defaultTier, meta }, i) => {
		const id = `__b${i}`;
		// Default import = the compiled mdsvex component. (Tier bodies carry no frontmatter, so there
		// is no `metadata` export to read here.)
		imports.push(
			`import ${id} from ${JSON.stringify(`/src/content/${category}/${slug}/tier-${defaultTier}.md`)};`
		);
		entries.push(`\t${JSON.stringify(meta.path)}: { tier: ${defaultTier}, component: ${id} }`);
	});
	return `// Generated by the bosco-content plugin. Do not edit.\n${imports.join('\n')}\nexport const eager = {\n${entries.join(',\n')}\n};\n`;
}
