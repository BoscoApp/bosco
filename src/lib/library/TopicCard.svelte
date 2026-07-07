<!--
	A link to one topic. A REAL <a href> to the canonical route (so deep links, middle-click, and
	no-JS all work); inside the desktop window a delegated handler intercepts the plain left-click and
	opens it in-window instead. Shows which tiers the topic offers, with the default one marked.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import type { Topic } from '$lib/content';
	import { TIER_LABEL, ALL_TIERS } from './tiers';

	let { topic }: { topic: Topic } = $props();
	const href = $derived(`${base}/library/${topic.category}/${topic.slug}/`);
	const tierNames = $derived(topic.tiers.map((t) => TIER_LABEL[t]).join(', '));
</script>

<a class="topic-card" {href}>
	<span class="tc-title">{topic.title}</span>
	<span class="tc-summary">{topic.summary}</span>
	<span class="tc-tiers" aria-label="Written for {tierNames}">
		{#each ALL_TIERS as t (t)}
			{@const has = topic.tiers.includes(t)}
			<span class="tc-pip" class:has class:def={has && t === topic.defaultTier} aria-hidden="true">
				{TIER_LABEL[t][0]}
			</span>
		{/each}
	</span>
</a>

<style>
	.topic-card {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 12px 14px;
		text-decoration: none;
		background: var(--surface-card);
		border: 1px solid var(--line-card);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-raised);
		transition: transform var(--motion-fast, 120ms) ease;
	}
	.topic-card:hover {
		transform: translateY(-1px);
		border-color: var(--edge-strong);
	}
	.topic-card:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
	}
	.tc-title {
		font-family: var(--font-ui);
		font-weight: bold;
		font-size: 14px;
		color: var(--ink);
	}
	.tc-summary {
		font-size: 12.5px;
		line-height: 1.4;
		color: var(--ink-soft);
	}
	.tc-tiers {
		display: inline-flex;
		gap: 4px;
		margin-top: 3px;
	}
	.tc-pip {
		display: grid;
		place-items: center;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		font-family: var(--font-ui);
		font-size: 10px;
		font-weight: bold;
		color: color-mix(in srgb, var(--ink) 30%, var(--paper));
		background: color-mix(in srgb, var(--ink) 8%, var(--paper));
	}
	.tc-pip.has {
		color: var(--ink-soft);
		background: color-mix(in srgb, var(--sel) 18%, var(--paper));
	}
	.tc-pip.def {
		color: #ffffff;
		background: var(--sel-deep);
	}
	@media (prefers-reduced-motion: reduce) {
		.topic-card {
			transition: none;
		}
		.topic-card:hover {
			transform: none;
		}
	}
</style>
