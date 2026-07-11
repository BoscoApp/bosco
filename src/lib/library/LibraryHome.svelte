<!--
	The Library's front desk: one shelf per category, each a header link to the full shelf plus a few
	topic cards. Host-agnostic — renders on the prerendered /library/ page and inside the desktop
	window. Every link is a real <a href>; the desktop intercepts plain left-clicks to browse in-window.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { topicsByCategory } from '$lib/content';
	import { CATEGORY_ORDER, CATEGORY_LABEL, CATEGORY_BLURB, CATEGORY_ACCENT } from './categories';
	import TopicCard from './TopicCard.svelte';
	import SurpriseButton from './SurpriseButton.svelte';
	import SearchPanel from './SearchPanel.svelte';

	/** Heading level: 1 on the standalone /library page, 2 inside a desktop window. */
	let { level = 1 }: { level?: 1 | 2 } = $props();

	const shelves = CATEGORY_ORDER.map((category) => ({
		category,
		topics: topicsByCategory(category)
	}));
</script>

<div class="lib-home">
	<header class="lh-head">
		<svelte:element this={`h${level}`} class="lh-title" data-view-heading tabindex="-1">
			The Library
		</svelte:element>
		<p class="lh-blurb">
			Look up anything under the sun — and above it. Every article can be read three ways: as a
			<b>Seedling</b>, an <b>Explorer</b>, or a <b>Scholar</b>.
		</p>
		<div class="lh-actions">
			<SurpriseButton />
		</div>
	</header>

	<SearchPanel />

	{#each shelves as { category, topics } (category)}
		<section class="shelf">
			<a class="shelf-head" href="{base}/library/{category}/">
				<span class="shelf-dot" style="background: {CATEGORY_ACCENT[category]}" aria-hidden="true"
				></span>
				<span class="shelf-name">{CATEGORY_LABEL[category]}</span>
				<span class="shelf-blurb">{CATEGORY_BLURB[category]}</span>
				<span class="shelf-count"
					>{topics.length}
					{topics.length === 1 ? 'article' : 'articles'} &rsaquo;</span
				>
			</a>

			{#if topics.length}
				<ul class="shelf-grid">
					{#each topics as topic (topic.path)}
						<li><TopicCard {topic} /></li>
					{/each}
				</ul>
			{:else}
				<p class="shelf-empty">Being stocked — new articles soon.</p>
			{/if}
		</section>
	{/each}
</div>

<style>
	.lh-head {
		margin-bottom: 18px;
	}
	.lh-title {
		margin: 0 0 4px;
		font-family: var(--font-display);
		font-size: 24px;
		line-height: 1.1;
		color: var(--ink);
	}
	.lh-blurb {
		margin: 0;
		max-width: 46ch;
		font-family: var(--font-body);
		font-size: 13.5px;
		line-height: 1.5;
		color: var(--ink-soft);
	}
	.lh-actions {
		margin-top: 12px;
	}
	.shelf {
		margin-top: 18px;
	}
	.shelf-head {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: baseline;
		column-gap: 8px;
		row-gap: 2px;
		padding: 8px 10px;
		text-decoration: none;
		background: var(--surface-titlebar);
		border: 1px solid var(--edge);
		border-radius: var(--radius-sm);
	}
	.shelf-head:hover {
		border-color: var(--edge-strong);
	}
	.shelf-head:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
	}
	.shelf-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		align-self: center;
	}
	.shelf-name {
		font-family: var(--font-ui);
		font-weight: bold;
		font-size: 15px;
		color: var(--ink);
	}
	.shelf-blurb {
		grid-column: 2;
		font-family: var(--font-body);
		font-size: 12px;
		color: var(--ink-soft);
	}
	.shelf-count {
		font-family: var(--font-ui);
		font-size: 12px;
		font-weight: bold;
		color: var(--sel-deep);
		white-space: nowrap;
	}
	.shelf-grid {
		list-style: none;
		margin: 8px 0 0;
		padding: 0;
		display: grid;
		gap: 10px;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	}
	.shelf-empty {
		margin: 8px 0 0;
		padding: 12px;
		font-family: var(--font-body);
		font-size: 13px;
		color: var(--ink-soft);
		background: color-mix(in srgb, var(--ink) 5%, var(--paper));
		border: 1px dashed var(--line-soft);
		border-radius: var(--radius-sm);
	}
	@media (max-width: 420px) {
		.shelf-head {
			grid-template-columns: auto 1fr;
		}
		.shelf-count {
			grid-column: 2;
			justify-self: start;
		}
		.shelf-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
