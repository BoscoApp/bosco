import type { Component } from 'svelte';
import { frontmatterSchema, type Frontmatter, type ContentTier } from './schema';

// The custom content module: glob-import topic folders, validate frontmatter with Zod at build
// time, and gate unreviewed content. This is the thin layer that replaces Astro-style content
// collections (brief §5). One topic = one folder: index.md (metadata) + tier-1/2/3.md (bodies).

// Unreviewed doctrine/content ships ONLY in an explicit preview build (brief §5 hard rule 5).
// Production default excludes it; `VITE_INCLUDE_PENDING=true npm run build` includes it.
const INCLUDE_PENDING = import.meta.env.VITE_INCLUDE_PENDING === 'true';

type MdModule = { metadata?: unknown; default: Component };

// Both eager: index.md gives frontmatter; tier bodies are eager so the active tier is *server
// rendered* into the prerendered HTML (Pagefind indexes real content, and switching tiers on the
// client is instant). Per-tier lazy loading is a Phase 1 optimisation if bundle size demands it.
const indexModules = import.meta.glob('/content/**/index.md', { eager: true }) as Record<
	string,
	MdModule
>;
const tierModules = import.meta.glob('/content/**/tier-*.md', { eager: true }) as Record<
	string,
	MdModule
>;

export interface Topic {
	slug: string;
	/** `${category}/${slug}` — the Library route path. */
	path: string;
	frontmatter: Frontmatter;
	tiers: Partial<Record<ContentTier, Component>>;
}

function parseIndexPath(indexPath: string): { category: string; slug: string; dir: string } {
	// '/content/creatures/red-fox/index.md'
	const parts = indexPath.split('/');
	return {
		category: parts[2],
		slug: parts[parts.length - 2],
		dir: parts.slice(0, -1).join('/')
	};
}

function build(): Topic[] {
	const topics: Topic[] = [];
	for (const [indexPath, mod] of Object.entries(indexModules)) {
		const parsed = frontmatterSchema.safeParse(mod.metadata);
		if (!parsed.success) {
			// Fail the build loudly — never ship a topic with broken frontmatter (brief §10.4).
			throw new Error(
				`[content] invalid frontmatter in ${indexPath}:\n${JSON.stringify(parsed.error.issues, null, 2)}`
			);
		}
		const fm = parsed.data;
		if (fm.review_status === 'pending' && !INCLUDE_PENDING) continue;

		const { slug, dir } = parseIndexPath(indexPath);
		const tiers: Topic['tiers'] = {};
		for (const tier of fm.tiers) {
			const tierPath = `${dir}/tier-${tier}.md`;
			const tierMod = tierModules[tierPath];
			if (!tierMod) {
				throw new Error(`[content] ${slug} declares tier ${tier} but ${tierPath} is missing`);
			}
			tiers[tier] = tierMod.default;
		}
		topics.push({ slug, path: `${fm.category}/${slug}`, frontmatter: fm, tiers });
	}
	const sorted = topics.sort((a, b) => a.slug.localeCompare(b.slug));
	assertRelatedResolve(sorted);
	return sorted;
}

/**
 * Referential integrity for `related` cross-links (brief §2.2). Every reference must point to a
 * topic present in the SAME review-gated set — a dangling target, or (in a production build) one
 * that is `review_status: pending` and therefore excluded, would otherwise fail the strict
 * adapter-static prerender with a cryptic `handleHttpError`. Catch it here with a clear content
 * message, matching the fail-loud frontmatter/tier checks above. Exported for unit testing.
 */
export function assertRelatedResolve(all: Topic[]): void {
	const present = new Set(all.map((t) => `${t.frontmatter.category}/${t.slug}`));
	for (const t of all) {
		for (const ref of t.frontmatter.related) {
			const key = `${ref.category}/${ref.slug}`;
			if (!present.has(key)) {
				throw new Error(
					`[content] ${t.path} lists a related topic that isn't available: ${key} ` +
						`(no such topic, or it is review_status:pending and excluded from this build)`
				);
			}
		}
	}
}

export const topics: Topic[] = build();

export function topicsByCategory(category: string): Topic[] {
	return topics.filter((t) => t.frontmatter.category === category);
}

export function getTopic(category: string, slug: string): Topic | undefined {
	return topics.find((t) => t.frontmatter.category === category && t.slug === slug);
}

/**
 * Resolve a topic's `related` references to their Topic objects, in declared order, skipping any
 * that don't resolve. Build-time integrity (assertRelatedResolve) already guarantees every included
 * topic's links resolve, so the skip is only defence-in-depth (e.g. a pending topic's link seen in
 * a preview build). Powers the "See also" block.
 */
export function relatedTopics(topic: Topic): Topic[] {
	return topic.frontmatter.related
		.map((ref) => getTopic(ref.category, ref.slug))
		.filter((t): t is Topic => t !== undefined);
}
