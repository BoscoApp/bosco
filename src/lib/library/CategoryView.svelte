<!--
	One shelf of the Library: every published topic in a category, as cards. Host-agnostic — the same
	view renders on the prerendered /library/[category]/ page and inside the desktop window.
-->
<script lang="ts">
	import { topicsByCategory, type Category } from '$lib/content';
	import { CATEGORY_LABEL, CATEGORY_BLURB, CATEGORY_ACCENT } from './categories';
	import TopicCard from './TopicCard.svelte';

	let { category }: { category: Category } = $props();
	const topics = $derived(topicsByCategory(category));
</script>

<section class="category">
	<header class="cat-head">
		<p class="cat-kicker" style="color: {CATEGORY_ACCENT[category]}">Shelf</p>
		<h1 class="cat-title" tabindex="-1">{CATEGORY_LABEL[category]}</h1>
		<p class="cat-blurb">{CATEGORY_BLURB[category]}</p>
	</header>

	{#if topics.length}
		<ul class="cat-grid">
			{#each topics as topic (topic.path)}
				<li><TopicCard {topic} /></li>
			{/each}
		</ul>
	{:else}
		<p class="cat-empty">
			This shelf is still being stocked. New {CATEGORY_LABEL[category].toLowerCase()} articles are on
			the way.
		</p>
	{/if}
</section>

<style>
	.cat-head {
		margin-bottom: 16px;
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
	.cat-blurb {
		margin: 0;
		font-family: var(--font-body);
		font-size: 13.5px;
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
