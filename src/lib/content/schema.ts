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

/**
 * A hotspot id is token-safe (lowercase letters, digits, hyphens) — it becomes both an HTML `id` and
 * an `aria-describedby` IDREF (a whitespace-separated token list), so a space or other stray character
 * would silently break the reference. Same shape + reasoning as the glossary's `GLOSS_ID_RE`.
 */
export const HOTSPOT_ID_RE = /^[a-z0-9-]+$/;

/**
 * A single labelled point on an anatomy diagram. `x`/`y` are PERCENTAGES (0–100) of the diagram box,
 * so a hotspot survives the display size and the eventual art swap. `blurb` is the teaching content —
 * baked into readable DOM unconditionally (see HotspotDiagram), never a JS-only reveal, so a no-JS or
 * print reader keeps the fact. `tier` is reserved for a future per-tier blurb; unused today.
 */
export const hotspotSchema = z.object({
	id: z.string().regex(HOTSPOT_ID_RE, 'must be a token-safe id (a–z, 0–9, hyphens)'),
	label: z.string().min(1),
	blurb: z.string().min(1),
	x: z.number().min(0).max(100),
	y: z.number().min(0).max(100),
	tier: tierLiteral.optional()
});
export type Hotspot = z.infer<typeof hotspotSchema>;

/**
 * A creature's anatomy diagram: a `media[]` id for the base plate (an ArtFrame placeholder until the
 * illustration lands — Decision #4) plus the labelled hotspots drawn over it. Optional on a topic;
 * {@link validateFieldGuide} enforces at build time that it appears only on creatures, that `diagram`
 * resolves to one of the topic's own `media[]` entries, and that every hotspot is well-formed.
 */
export const anatomySchema = z.object({
	diagram: z.string().min(1),
	hotspots: z.array(hotspotSchema).min(1)
});
export type Anatomy = z.infer<typeof anatomySchema>;

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
		kind: z.enum(KINDS).optional(),
		/**
		 * Field Guide anatomy diagram (creatures only). The creature-only rule and the
		 * `diagram → media[]` resolution live in {@link validateFieldGuide} at the build's
		 * `scanPublished` site — not this per-object `.superRefine` — so all diagram integrity
		 * (which needs the topic's `media[]` to cross-check) sits in one place, mirroring
		 * {@link validateCrossLinks}/{@link validateArchives}.
		 */
		anatomy: anatomySchema.optional()
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

/**
 * Build-time integrity check for the Field Guide's per-creature anatomy diagram (FG-6), run over the
 * gated shipping set at the `scanPublished` site (the {@link validateCrossLinks}/{@link validateArchives}
 * precedent). For every topic that declares `anatomy`:
 *   - it must be a `creatures` topic — anatomy is meaningless on faith/world content;
 *   - `anatomy.diagram` must resolve to one of the topic's OWN `media[]` entries, and that entry must
 *     be a `diagram` (so the art-swap seam points at the right asset class, never a stray illustration);
 *   - every hotspot needs a stable, unique id, a non-empty `label` AND `blurb` (the label is the pin
 *     button's accessible name and the blurb is the baked teaching text — an empty one ships a nameless
 *     control or a blank fact), and in-range 0–100 percentage coords.
 * Any dangling or malformed diagram throws, failing the build. Self-contained: it validates its inputs
 * directly (not trusting the Zod schema), so it is provable in a unit test with hand-built topics.
 */
export function validateFieldGuide(
	topics: readonly {
		path: string;
		category: string;
		media: readonly { id: string; kind: string }[];
		anatomy?: {
			diagram: string;
			hotspots: readonly { id: string; label: string; blurb: string; x: number; y: number }[];
		};
	}[]
): void {
	for (const t of topics) {
		const anatomy = t.anatomy;
		if (!anatomy) continue;

		if (t.category !== 'creatures') {
			throw new Error(
				`Topic "${t.path}" declares "anatomy", but an anatomy diagram is only valid on creatures.`
			);
		}

		const plate = t.media.find((m) => m.id === anatomy.diagram);
		if (!plate) {
			throw new Error(
				`Topic "${t.path}" anatomy.diagram "${anatomy.diagram}" names no media[] entry on this topic.`
			);
		}
		if (plate.kind !== 'diagram') {
			throw new Error(
				`Topic "${t.path}" anatomy.diagram "${anatomy.diagram}" must reference a media[] entry of ` +
					`kind "diagram" (it is "${plate.kind}").`
			);
		}

		if (anatomy.hotspots.length === 0) {
			throw new Error(`Topic "${t.path}" anatomy has no hotspots.`);
		}
		const seen = new Set<string>();
		for (const h of anatomy.hotspots) {
			if (!HOTSPOT_ID_RE.test(h.id)) {
				throw new Error(
					`Topic "${t.path}" has an anatomy hotspot id "${h.id}" that is not token-safe (a–z, 0–9, ` +
						`hyphens); it becomes an HTML id and an aria-describedby reference.`
				);
			}
			if (seen.has(h.id)) {
				throw new Error(`Topic "${t.path}" repeats the anatomy hotspot id "${h.id}".`);
			}
			seen.add(h.id);
			if (!h.label.trim()) {
				throw new Error(`Topic "${t.path}" anatomy hotspot "${h.id}" has an empty label.`);
			}
			if (!h.blurb.trim()) {
				throw new Error(`Topic "${t.path}" anatomy hotspot "${h.id}" has an empty blurb.`);
			}
			for (const [axis, v] of [
				['x', h.x],
				['y', h.y]
			] as const) {
				if (!(v >= 0 && v <= 100)) {
					throw new Error(
						`Topic "${t.path}" anatomy hotspot "${h.id}" has ${axis}=${v}, outside the 0–100 range.`
					);
				}
			}
		}
	}
}
