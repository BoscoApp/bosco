import type { Tier } from '$lib/content';

/** Reader-facing names for the three reading tiers. */
export const TIER_LABEL: Record<Tier, string> = {
	1: 'Seedling',
	2: 'Explorer',
	3: 'Scholar'
};

/** A one-line "who it's for" used as a hint under the switch. */
export const TIER_HINT: Record<Tier, string> = {
	1: 'Ages 4–6 · short and simple',
	2: 'Ages 7–9 · a fuller story',
	3: 'Ages 10–13 · the deep dive'
};

export const ALL_TIERS: Tier[] = [1, 2, 3];

/** The `data-tier` keyword for each tier — set locally on an article so its type scale follows the
 *  active (possibly overridden) tier, matching the axis app.html sets globally on <html>. */
export const TIER_WORD: Record<Tier, 'seedling' | 'explorer' | 'scholar'> = {
	1: 'seedling',
	2: 'explorer',
	3: 'scholar'
};
