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
	review_status: z.enum(REVIEW_STATUSES),
	sources: z.array(sourceSchema).default([]),
	media: z.array(mediaSchema).default([]),
	archives: z.array(archiveSchema).default([]),
	/** Optional liturgical-calendar join (observance id) for Faith topics. */
	observance_id: z.string().optional()
});

export type TopicFrontmatter = z.infer<typeof topicFrontmatterSchema>;

/** Frontmatter plus derived location. */
export interface TopicMeta extends TopicFrontmatter {
	slug: string;
	/** `${category}/${slug}` */
	path: string;
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
