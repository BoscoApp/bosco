import { topics as rawTopics } from 'virtual:bosco/content';
import type { Category, Tier, TopicMeta } from './schema';

export type TierLoader = () => Promise<{
	default: unknown;
	metadata?: Record<string, unknown>;
}>;

export interface Topic extends TopicMeta {
	loaders: Partial<Record<Tier, TierLoader>>;
}

/** All topics that may ship in this build (production = approved only). */
export const topics: Topic[] = rawTopics as Topic[];

export function getTopic(category: Category, slug: string): Topic | undefined {
	return topics.find((t) => t.category === category && t.slug === slug);
}

export function topicsByCategory(category: Category): Topic[] {
	return topics.filter((t) => t.category === category);
}

export type { Category, Tier, TopicMeta };
