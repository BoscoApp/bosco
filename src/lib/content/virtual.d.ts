declare module 'virtual:bosco/content' {
	import type { TopicMeta, Tier } from './schema';

	export type TierLoader = () => Promise<{
		default: unknown;
		metadata?: Record<string, unknown>;
	}>;

	export const topics: Array<TopicMeta & { loaders: Partial<Record<Tier, TierLoader>> }>;
}

declare module 'virtual:bosco/content-eager' {
	import type { Component } from 'svelte';
	import type { Tier } from './schema';

	/** Default-tier bodies as static imports, keyed by topic path (`${category}/${slug}`). */
	export const eager: Record<string, { tier: Tier; component: Component }>;
}
