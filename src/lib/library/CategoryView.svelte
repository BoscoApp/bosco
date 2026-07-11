<!--
	One shelf of the Library: every published topic in a category, as cards. Host-agnostic — the same
	view renders on the prerendered /library/[category]/ page and inside the desktop window. The header
	carries an art-agnostic masthead frame (where a category illustration will land), the article count,
	and a static "reading levels this shelf offers" strip — all derived from the shipping topic set, so
	it is identical in both hosts and needs no reading-level state.
-->
<script lang="ts">
	import { topicsByCategory, type Category } from '$lib/content';
	import { CATEGORY_LABEL, CATEGORY_BLURB, CATEGORY_ACCENT } from './categories';
	import { TIER_LABEL, ALL_TIERS } from './tiers';
	import TopicCard from './TopicCard.svelte';
	import ArtFrame from './ArtFrame.svelte';

	/** Heading level: 1 on the standalone /library/[category] page, 2 inside a desktop window. */
	let { category, level = 1 }: { category: Category; level?: 1 | 2 } = $props();
	const topics = $derived(topicsByCategory(category));

	// Which reading levels this shelf offers, in tier order — the union across its topics.
	const levels = $derived.by(() => {
		const offered = new Set(topics.flatMap((t) => t.tiers));
		return ALL_TIERS.filter((t) => offered.has(t)).map((t) => TIER_LABEL[t]);
	});
</script>

<section class="category">
	<ArtFrame ratio="4 / 1" accent={CATEGORY_ACCENT[category]} label={CATEGORY_LABEL[category]} />
	<header class="cat-head">
		<p class="cat-kicker" style="color: {CATEGORY_ACCENT[category]}">Shelf</p>
		<svelte:element this={`h${level}`} class="cat-title" data-view-heading tabindex="-1">
			{CATEGORY_LABEL[category]}
		</svelte:element>
		<p class="cat-blurb">{CATEGORY_BLURB[category]}</p>
		<p class="cat-meta">
			<span class="cat-count">{topics.length} {topics.length === 1 ? 'article' : 'articles'}</span>
			{#if topics.length && levels.length}
				<span class="cat-sep" aria-hidden="true"> · </span>
				<span class="cat-levels">Written for {levels.join(', ')}</span>
			{/if}
		</p>
	</header>

	{#if topics.length}
		<ul class="cat-grid">
			{#each topics as topic (topic.path)}
				<li><TopicCard {topic} /></li>
			{/each}
		</ul>
	{:else}
		<p class="cat-empty">
			This shelf is still being stocked — new {CATEGORY_LABEL[category].toLowerCase()} articles are on
			their way.
		</p>
	{/if}
</section>

<style>
	.category {
		display: flex;
		flex-direction: column;
	}
	.cat-head {
		margin: 12px 0 16px;
	}
	.cat-kicker {
		margin: 0 0 2px;
		font-family: var(--font-ui);
		font-size: 11.5px;
		font-weight: bold;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.cat-title {
		margin: 0 0 4px;
		font-family: var(--font-display);
		font-size: 22px;
		line-height: 1.1;
		color: var(--ink);
	}
	.cat-title:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 3px;
		border-radius: 3px;
	}
	.cat-blurb {
		margin: 0 0 6px;
		font-family: var(--font-body);
		font-size: 13.5px;
		color: var(--ink-soft);
	}
	.cat-meta {
		margin: 0;
		font-family: var(--font-ui);
		font-size: 12px;
	}
	.cat-count {
		font-weight: bold;
		color: var(--sel-deep);
	}
	.cat-sep {
		color: var(--ink-soft);
	}
	.cat-levels {
		color: var(--ink-soft);
	}
	.cat-grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 10px;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	}
	.cat-empty {
		margin: 0;
		padding: 18px;
		font-family: var(--font-body);
		font-size: 13.5px;
		color: var(--ink-soft);
		background: color-mix(in srgb, var(--ink) 5%, var(--paper));
		border: 1px dashed var(--line-soft);
		border-radius: var(--radius-sm);
	}
	@media (max-width: 420px) {
		.cat-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
