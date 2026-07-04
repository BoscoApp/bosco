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
