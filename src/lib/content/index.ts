import type { Component } from 'svelte';
import { topics as rawTopics } from 'virtual:bosco/content';
import { eager as rawEager } from 'virtual:bosco/content-eager';
import type { Category, Tier, TopicMeta } from './schema';

/** A compiled tier body (a Svelte component) plus its mdsvex `metadata`. */
export interface TierModule {
	default: Component;
	metadata?: Record<string, unknown>;
}

export type TierLoader = () => Promise<TierModule>;

export interface Topic extends TopicMeta {
	loaders: Partial<Record<Tier, TierLoader>>;
}

/** A topic's default tier, resolved eagerly so a route can render it synchronously at prerender. */
export interface EagerBody {
	tier: Tier;
	component: Component;
}

/** All topics that may ship in this build (production = approved only). */
export const topics: Topic[] = rawTopics as Topic[];

/** Default-tier bodies keyed by topic path (`${category}/${slug}`) — see the content plugin. */
export const eager: Record<string, EagerBody> = rawEager as Record<string, EagerBody>;

export function getTopic(category: Category, slug: string): Topic | undefined {
	return topics.find((t) => t.category === category && t.slug === slug);
}

export function topicsByCategory(category: Category): Topic[] {
	return topics.filter((t) => t.category === category);
}

/** The eagerly-resolved default-tier body for a topic (for synchronous prerender rendering). */
export function eagerBody(path: string): EagerBody | undefined {
	return eager[path];
}

export { CATEGORIES, TIERS } from './schema';
export type { Category, Tier, TopicMeta };
