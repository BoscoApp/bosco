import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import type { Plugin } from 'vite';
import {
	topicFrontmatterSchema,
	isPublished,
	pickDefaultTier,
	validateCrossLinks,
	type TopicMeta
} from './schema';

const VIRTUAL_ID = 'virtual:bosco/content';
const RESOLVED_ID = '\0' + VIRTUAL_ID;
// A companion module whose default-tier bodies are STATIC imports (not lazy). Rendering one of
// these at prerender time bakes real prose into the static HTML — the offline/no-JS/search floor.
const EAGER_ID = 'virtual:bosco/content-eager';
const EAGER_RESOLVED_ID = '\0' + EAGER_ID;
const CONTENT_ROOT = 'src/content';

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
		},

		resolveId(id) {
			if (id === VIRTUAL_ID) return RESOLVED_ID;
			if (id === EAGER_ID) return EAGER_RESOLVED_ID;
		},

		load(id) {
			if (id === RESOLVED_ID) return collect(root, preview).main;
			if (id === EAGER_RESOLVED_ID) return collect(root, preview).eager;
		},

		handleHotUpdate({ file, server }) {
			if (file.replace(/\\/g, '/').includes('/src/content/')) {
				for (const rid of [RESOLVED_ID, EAGER_RESOLVED_ID]) {
					const mod = server.moduleGraph.getModuleById(rid);
					if (mod) server.moduleGraph.invalidateModule(mod);
				}
				server.ws.send({ type: 'full-reload' });
				return [];
			}
		}
	};
}

interface Published {
	meta: TopicMeta;
	category: string;
	slug: string;
	tiers: number[];
	defaultTier: number;
}

/** Read + gate every topic once, returning the source of both virtual modules. */
function collect(root: string, preview: boolean): { main: string; eager: string } {
	const contentDir = join(root, CONTENT_ROOT);
	if (!existsSync(contentDir)) {
		return { main: 'export const topics = [];\n', eager: 'export const eager = {};\n' };
	}

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

	return { main: mainModule(published), eager: eagerModule(published) };
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
