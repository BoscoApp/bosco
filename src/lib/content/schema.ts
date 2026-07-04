import { z } from 'zod';

// Frontmatter contract for every Library topic (brief §2.2). Getting this right BEFORE authoring
// is the point of Phase 0 (§10.4). Malformed frontmatter throws at build time (see ./index.ts),
// so a bad file fails the build rather than shipping broken.

export const CATEGORIES = ['creatures', 'faith', 'world'] as const;
export const CONTENT_TIERS = ['1', '2', '3'] as const;
export const REVIEW_STATUSES = ['pending', 'approved'] as const;

export type Category = (typeof CATEGORIES)[number];
export type ContentTier = (typeof CONTENT_TIERS)[number];

// Human labels for each Library category — the single source of truth shared by the Library index
// and the per-category landing pages. Keyed by Category, so adding a category without a label is a
// compile error rather than a silently-missing heading.
export const CATEGORY_LABEL: Record<Category, string> = {
	creatures: 'Creatures',
	faith: 'Faith',
	world: 'World'
};

export const sourceSchema = z.object({
	title: z.string(),
	author: z.string().optional(),
	year: z.union([z.number(), z.string()]).optional(),
	license: z.string(),
	url: z.string().optional()
});

export const mediaSchema = z.object({
	kind: z.enum(['image', 'diagram', 'audio']).default('image'),
	// `src` is optional in Phase 0: the illustration treatment (Open Decision #4) is deferred, so
	// topics carry a described-but-empty media slot the layout renders as a placeholder frame.
	src: z.string().optional(),
	alt: z.string(),
	credit: z.string().optional()
});

// The Archives shelf (brief §2.2): curated verbatim public-domain deep-dives. Present in the
// schema from Phase 0; content ramps in Phase 2+.
export const archiveSchema = z.object({
	title: z.string(),
	source: z.string(),
	license: z.string(),
	intro: z.string().optional()
});

export const frontmatterSchema = z.object({
	topic: z.string(),
	title: z.string(),
	category: z.enum(CATEGORIES),
	tiers: z.array(z.enum(CONTENT_TIERS)).nonempty(),
	summary: z.string().optional(),
	sources: z.array(sourceSchema).default([]),
	media: z.array(mediaSchema).default([]),
	archives: z.array(archiveSchema).default([]),
	// Cross-links to related topics, rendered as a "See also" block. Referenced by {category, slug}
	// so they resolve through getTopic(); referential integrity (the target actually exists in the
	// built, review-gated set) is enforced at build time in ./index.ts, not here — Zod can't see
	// other files. Defaults to [] so existing topics need no change.
	related: z.array(z.object({ category: z.enum(CATEGORIES), slug: z.string() })).default([]),
	review_status: z.enum(REVIEW_STATUSES).default('pending')
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;
