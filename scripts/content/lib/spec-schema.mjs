import { z } from 'zod';

/**
 * The spec is what the OWNER writes: one `*.topic.md` per topic under `scripts/content/specs/`. Its
 * frontmatter carries the topic's identity + provenance; its body carries the raw source (adapted) or
 * the exact verbatim text in labelled blocks (verbatim) — the body is parsed in `ingest.mjs`, not here.
 *
 * The enums are intentionally inlined (not imported from `src/lib/content/schema.ts`) so this authoring
 * tool stays a standalone, dependency-light `.mjs` — like `scripts/calendar/`. `emit.test.ts` re-parses
 * the tool's OUTPUT through the REAL `topicFrontmatterSchema`, so any drift between the two is caught.
 */
export const CONTENT_KINDS = ['adapted', 'verbatim'];
export const SPEC_CATEGORIES = ['creatures', 'faith', 'world'];

// Field Guide taxonomy — kept in lockstep with HABITATS/KINDS in `src/lib/content/schema.ts`. Inlined
// (not imported) to keep this authoring tool standalone; `emit.test.ts` re-parses the tool's OUTPUT
// through the REAL schema, so any drift between the two lists is caught.
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
];
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
];

const tierLiteral = z.union([z.literal(1), z.literal(2), z.literal(3)]);

const sourceSchema = z.object({
	title: z.string().min(1),
	license: z.string().optional(),
	url: z.string().url().optional(),
	note: z.string().optional()
});

/**
 * `content_kind` is REQUIRED with NO default. This is deliberate and load-bearing: you must not be
 * able to "forget" the field and silently get ADAPTATION applied to doctrine. Fail-closed, matching
 * the codebase's existing choice to make `glossaryEntryFrontmatterSchema.review_status` required.
 */
export const specFrontmatterSchema = z
	.object({
		content_kind: z.enum(CONTENT_KINDS),
		title: z.string().min(1),
		category: z.enum(SPEC_CATEGORIES),
		slug: z.string().regex(/^[a-z0-9-]+$/, 'slug must be kebab-case (a-z, 0-9, -)'),
		summary: z.string().min(1),
		tiers: z.array(tierLiteral).min(1),
		default_tier: tierLiteral.optional(),
		sources: z.array(sourceSchema).default([]),
		related: z
			.array(z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/, 'must look like "category/slug"'))
			.default([]),
		observance_id: z.string().optional(),
		// Field Guide taxonomy: REQUIRED on creatures, FORBIDDEN elsewhere (see `.superRefine`).
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

/** @typedef {z.infer<typeof specFrontmatterSchema>} SpecFrontmatter */
