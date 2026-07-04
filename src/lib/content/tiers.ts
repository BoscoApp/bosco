import type { Tier } from '$lib/state/schema';
import type { ContentTier } from './schema';

// Bridge the app-facing tier vocabulary (Seedling/Explorer/Scholar) to content tier numbers.
export const TIER_TO_NUMBER: Record<Tier, ContentTier> = {
	seedling: '1',
	explorer: '2',
	scholar: '3'
};

export const TIER_LABEL: Record<Tier, string> = {
	seedling: 'Seedling',
	explorer: 'Explorer',
	scholar: 'Scholar'
};

export const TIER_ORDER: Tier[] = ['seedling', 'explorer', 'scholar'];

/**
 * Parse a `#tier=` URL hash into a reading tier, or null if absent/unrecognised. This drives the
 * per-article tier override — a shareable link like `/library/creatures/red-fox/#tier=seedling`
 * opens that article at a given level WITHOUT touching the reader's persisted default. The
 * vocabulary is the app-facing tier words (seedling/explorer/scholar), case-insensitive; anything
 * else (including the numeric content-tier form) returns null. Pure and client-agnostic.
 */
export function parseTierHash(hash: string | null | undefined): Tier | null {
	if (!hash) return null;
	const value = new URLSearchParams(hash.replace(/^#/, '')).get('tier');
	if (!value) return null;
	const lower = value.toLowerCase();
	return (TIER_ORDER as string[]).includes(lower) ? (lower as Tier) : null;
}

/**
 * Resolve the best available tier for a topic: prefer the requested tier, otherwise the nearest
 * one that exists (never render blank — brief §2.8 lets an advanced kid drop down or a young kid
 * peek up, and a topic may not author all three tiers).
 */
export function resolveTier(requested: ContentTier, available: ContentTier[]): ContentTier {
	if (available.includes(requested)) return requested;
	const want = Number(requested);
	let best = available[0];
	let bestDist = Infinity;
	for (const tier of available) {
		const dist = Math.abs(Number(tier) - want);
		if (dist < bestDist) {
			bestDist = dist;
			best = tier;
		}
	}
	return best;
}
