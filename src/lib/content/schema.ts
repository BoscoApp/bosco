import { z } from 'zod';
import { REVIEW_STATUSES, TOPIC_PATH_RE, GLOSS_ID_RE, isPublished } from './gate.js';

// The gate primitive lives in gate.js (the single, Node-loadable source shared with the remark
// plugin). Re-export it so existing `from './schema'` imports keep working unchanged.
export { REVIEW_STATUSES, TOPIC_PATH_RE, GLOSS_ID_RE, isPublished };

/** Top-level content categories (also the folder names under `src/content/`). */
export const CATEGORIES = ['creatures', 'faith', 'world'] as const;
export type Category = (typeof CATEGORIES)[number];

/** Reading tiers: 1 = Seedling (4–6), 2 = Explorer (7–9), 3 = Scholar (10–13). */
export const TIERS = [1, 2, 3] as const;
export type Tier = (typeof TIERS)[number];

/**
 * MDX-level review state (values defined in gate.js). The doctrine gate ships ONLY `approved` topics
 * to production; the finer human workflow (needs-review, needs-doctrinal-review, changes-requested)
 * lives on the GitHub issue's `content:` label.
 */
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/** Illustration is a theme axis: each asset can carry a variant per theme. */
export const THEMES = ['clubhouse', 'meadow'] as const;
export type Theme = (typeof THEMES)[number];

/**
 * Habitats a creature can live in — the Field Guide's "by habitat" axis. A CLOSED enum, so a typo
 * fails at parse and the axis can never mint an empty page from a mistake. Multi-valued on a topic
 * (a fox is woodland AND farmland). Membership is a content call; grow it as the corpus grows.
 */
export const HABITATS = [
	'woodland',
	'grassland',
	'wetland',
	'ocean',
	'river',
	'desert',
	'mountain',
	'polar',
	'sky',
	'farmland',
	'garden'
] as const;
export type Habitat = (typeof HABITATS)[number];

/**
 * A creature's kind (single-valued) — the Field Guide's "by kind" axis. `bestiary` covers symbolic /
 * heraldic creatures (e.g. the basilisk) that aren't a zoological class. Closed enum, same reasoning.
 */
export const KINDS = [
	'mammal',
	'bird',
	'fish',
	'reptile',
	'amphibian',
	'insect',
	'arachnid',
	'mollusk',
	'bestiary'
] as const;
export type CreatureKind = (typeof KINDS)[number];

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
export const topicFrontmatterSchema = z
	.object({
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
		observance_id: z.string().optional(),
		/**
		 * Field Guide taxonomy — REQUIRED on `creatures`, FORBIDDEN elsewhere (both enforced by the
		 * `.superRefine` below). `habitat` is multi-valued; `kind` is single. Closed enums so the
		 * "by habitat" / "by kind" axes can never mint an empty page from a typo.
		 */
		habitat: z.array(z.enum(HABITATS)).min(1).optional(),
		kind: z.enum(KINDS).optional()
	})
	.superRefine((fm, ctx) => {
		const isCreature = fm.category === 'creatures';
		if (isCreature && fm.habitat === undefined) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['habitat'],
				message: 'creatures must declare at least one habitat'
			});
		}
		if (isCreature && fm.kind === undefined) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['kind'],
				message: 'creatures must declare a kind'
			});
		}
		if (!isCreature && fm.habitat !== undefined) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['habitat'],
				message: 'habitat is only valid on creature topics'
			});
		}
		if (!isCreature && fm.kind !== undefined) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['kind'],
				message: 'kind is only valid on creature topics'
			});
		}
	});

export type TopicFrontmatter = z.infer<typeof topicFrontmatterSchema>;

/**
 * A glossary entry's frontmatter, as authored in `src/glossary/{general,faith}/<id>.md`. The body of
 * the file is the plain-text definition (not frontmatter). `review_status` is REQUIRED with no default
 * — every term carries its OWN doctrine gate, so a faith definition can never ship unreviewed just
 * because someone forgot a field. An invalid glossary file fails the build (fail-closed parity with
 * topics). `term` is an optional human label (unused today; reserved for a future glossary index).
 */
export const glossaryEntryFrontmatterSchema = z.object({
	review_status: z.enum(REVIEW_STATUSES),
	term: z.string().min(1).optional(),
	sources: z.array(sourceSchema).default([])
});

export type GlossaryEntryFrontmatter = z.infer<typeof glossaryEntryFrontmatterSchema>;

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

/**
 * Build-time integrity check for a topic's Archives manifest. Each `archives[]` entry names a
 * public-domain source document by `file`; two entries pointing at the same `file` within one topic is
 * an authoring mistake (a duplicate shelf row). Throws on the first duplicate. This locks the seam for
 * when archive documents and their viewer arrive — no PRODUCTION topic declares archives yet (only the
 * gated dev fixture does), so it effectively no-ops in a production build. (Where archive files live and
 * how they are served is deliberately left to the viewer PR; this does not check the filesystem.)
 */
export function validateArchives(
	topics: readonly { path: string; archives: readonly { file: string }[] }[]
): void {
	for (const t of topics) {
		const seen = new Set<string>();
		for (const a of t.archives) {
			if (seen.has(a.file)) {
				throw new Error(`Topic "${t.path}" lists the archive file "${a.file}" twice.`);
			}
			seen.add(a.file);
		}
	}
}
