declare module 'virtual:bosco/content' {
	import type { TopicMeta, Tier } from './schema';

	export type TierLoader = () => Promise<{
		default: unknown;
		metadata?: Record<string, unknown>;
	}>;

	export const topics: Array<TopicMeta & { loaders: Partial<Record<Tier, TierLoader>> }>;
}
