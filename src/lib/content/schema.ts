import { z } from 'zod';

/** Top-level content categories (also the folder names under `src/content/`). */
export const CATEGORIES = ['creatures', 'faith', 'world'] as const;
export type Category = (typeof CATEGORIES)[number];

/** Reading tiers: 1 = Seedling (4–6), 2 = Explorer (7–9), 3 = Scholar (10–13). */
export const TIERS = [1, 2, 3] as const;
export type Tier = (typeof TIERS)[number];

/**
 * MDX-level review state. The doctrine gate ships ONLY `approved` topics to production.
 * The finer human workflow (needs-review, needs-doctrinal-review, changes-requested) lives
 * on the GitHub issue's `content:` label; here we only need the build decision.
 */
export const REVIEW_STATUSES = ['draft', 'pending', 'approved'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/** Illustration is a theme axis: each asset can carry a variant per theme. */
export const THEMES = ['clubhouse', 'meadow'] as const;
export type Theme = (typeof THEMES)[number];

const tierLiteral = z.union([z.literal(1), z.literal(2), z.literal(3)]);

/** A topic path (`category/slug`) as used to reference another topic in `related`. */
export const TOPIC_PATH_RE = /^[a-z0-9-]+\/[a-z0-9-]+$/;

export const mediaVariantSchema = z.object({
	theme: z.enum(THEMES),
	src: z.string().min(1),
	alt: z.string().min(1),
	license: z.string().optional(),
	source: z.string().optional()
});

export const mediaSchema = z.object({
	id: z.string().min(1),
	kind: z.enum(['illustration', 'photo', 'diagram', 'map']).default('illustration'),
	variants: z.array(mediaVariantSchema).min(1)
});

/** A provenance reference. `url` is metadata only — never rendered as a runtime link. */
export const sourceSchema = z.object({
	title: z.string().min(1),
	license: z.string().optional(),
	url: z.string().url().optional(),
	note: z.string().optional()
});

export const archiveSchema = z.object({
	title: z.string().min(1),
	file: z.string().min(1),
	source: z.string().optional(),
	license: z.string().optional()
});

/** Topic frontmatter, as authored in each topic's `index.md`. */
export const topicFrontmatterSchema = z.object({
	title: z.string().min(1),
	category: z.enum(CATEGORIES),
	summary: z.string().min(1),
	tiers: z.array(tierLiteral).min(1),
	/**
	 * Which tier a reader lands on before any choice — the ONE tier baked into the prerendered
	 * page (so it has real prose offline and yields exactly one search record). Clamped to the
	 * nearest declared tier; defaults to Explorer (2), matching the app-wide default in app.html.
	 */
	default_tier: tierLiteral.optional(),
	review_status: z.enum(REVIEW_STATUSES),
	sources: z.array(sourceSchema).default([]),
	media: z.array(mediaSchema).default([]),
	archives: z.array(archiveSchema).default([]),
	/**
	 * Curated "See also" cross-links: other topics' `category/slug` paths. Additive and optional.
	 * Validated at build time by {@link validateCrossLinks} — every entry must resolve to another
	 * topic that ships in the same build (so a production link can never dangle or point at
	 * unreviewed content), with no self-reference and no duplicates.
	 */
	related: z.array(z.string().regex(TOPIC_PATH_RE, 'must look like "category/slug"')).default([]),
	/** Optional liturgical-calendar join (observance id) for Faith topics. */
	observance_id: z.string().optional()
});

export type TopicFrontmatter = z.infer<typeof topicFrontmatterSchema>;

/** Frontmatter plus derived location and the resolved default tier. */
export interface TopicMeta extends TopicFrontmatter {
	slug: string;
	/** `${category}/${slug}` */
	path: string;
	/** The tier a reader opens at (see {@link pickDefaultTier}); prerendered into the static page. */
	defaultTier: Tier;
}

/**
 * The tier a topic opens at: its declared `default_tier` if that tier exists, otherwise the
 * declared tier nearest to Explorer (2) — ties break toward the lower (gentler) tier. This is the
 * single tier that gets prerendered into the topic's static page.
 */
export function pickDefaultTier(tiers: readonly number[], preferred?: number): Tier {
	const want = preferred ?? 2;
	if (tiers.includes(want)) return want as Tier;
	const nearest = [...tiers].sort((a, b) => Math.abs(a - want) - Math.abs(b - want) || a - b)[0];
	return nearest as Tier;
}

export interface GateOptions {
	/** When true, non-approved content is included (dev server + preview builds). */
	preview: boolean;
}

/**
 * The single source of truth for "may this topic ship?".
 * Production builds (preview = false) include only `approved` topics — doctrine never ships
 * unreviewed. This is enforced at build time by the content Vite plugin, not at runtime.
 */
export function isPublished(status: ReviewStatus, { preview }: GateOptions): boolean {
	return preview || status === 'approved';
}

/**
 * Build-time integrity check for curated "See also" cross-links. The input is the set of topics that
 * WILL ship in this build (already run through the gate), so validating each `related` entry against
 * that set has an important consequence: in a production build (gated to `approved`), a link whose
 * target was gated out simply isn't in the set — this enforces approved → approved, and a "See also"
 * link can never dangle or surface unreviewed content in production. Throws on the first problem.
 */
export function validateCrossLinks(
	topics: readonly { path: string; related: readonly string[] }[]
): void {
	const paths = new Set(topics.map((t) => t.path));
	for (const t of topics) {
		const seen = new Set<string>();
		for (const rel of t.related) {
			if (rel === t.path) {
				throw new Error(`Topic "${t.path}" lists itself in "related".`);
			}
			if (seen.has(rel)) {
				throw new Error(`Topic "${t.path}" lists "${rel}" twice in "related".`);
			}
			seen.add(rel);
			if (!paths.has(rel)) {
				throw new Error(
					`Topic "${t.path}" links to "${rel}" in "related", but no such topic ships in this ` +
						`build — a dangling or unreviewed cross-link. Fix the path or approve the target.`
				);
			}
		}
	}
}
