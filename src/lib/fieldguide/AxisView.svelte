<!--
	One Field Guide axis page: every published creature that shares a single habitat or kind, as cards.
	Host-agnostic (renders on the prerendered /field-guide/habitat|kind/[value]/ route and inside the
	desktop window). It filters the gated `topicsByCategory('creatures')` — no separate content silo —
	and composes the same TopicCard + masthead frame the Library uses. Presentation-only (like
	CategoryView): the desktop window supplies the in-window crumb; the standalone page uses the
	surrounding "Open in Bosco" chrome.
-->
<script lang="ts">
	import { topicsByCategory, type Habitat, type CreatureKind } from '$lib/content';
	import { HABITAT_LABEL, KIND_LABEL } from './axes';
	import TopicCard from '$lib/library/TopicCard.svelte';
	import ArtFrame from '$lib/library/ArtFrame.svelte';

	/** `axis` picks the label map + the filter; `value` is a validated present habitat/kind. */
	let {
		axis,
		value,
		level = 1
	}: { axis: 'habitat' | 'kind'; value: string; level?: 1 | 2 } = $props();

	const label = $derived(
		axis === 'habitat' ? HABITAT_LABEL[value as Habitat] : KIND_LABEL[value as CreatureKind]
	);
	const kicker = $derived(axis === 'habitat' ? 'By habitat' : 'By kind');
	const topics = $derived(
		topicsByCategory('creatures').filter((t) =>
			axis === 'habitat' ? (t.habitat ?? []).includes(value as Habitat) : t.kind === value
		)
	);
</script>

<section class="axis">
	<ArtFrame ratio="4 / 1" accent="var(--green)" {label} />
	<header class="axis-head">
		<p class="axis-kicker">{kicker}</p>
		<svelte:element this={`h${level}`} class="axis-title" data-view-heading tabindex="-1">
			{label}
		</svelte:element>
		<p class="axis-meta">
			<span class="axis-count"
				>{topics.length} {topics.length === 1 ? 'creature' : 'creatures'}</span
			>
		</p>
	</header>

	{#if topics.length}
		<ul class="axis-grid">
			{#each topics as topic (topic.path)}
				<li><TopicCard {topic} /></li>
			{/each}
		</ul>
	{:else}
		<p class="axis-empty">No creatures here yet — more are on their way.</p>
	{/if}
</section>

<style>
	.axis {
		display: flex;
		flex-direction: column;
	}
	.axis-head {
		margin: 12px 0 16px;
	}
	.axis-kicker {
		margin: 0 0 2px;
		font-family: var(--font-ui);
		font-size: 11.5px;
		font-weight: bold;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		/* AA-contrast partner for green text on paper. */
		color: var(--ink-green);
	}
	.axis-title {
		margin: 0 0 4px;
		font-family: var(--font-display);
		font-size: 22px;
		line-height: 1.1;
		color: var(--ink);
	}
	.axis-title:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 3px;
		border-radius: 3px;
	}
	.axis-meta {
		margin: 0;
		font-family: var(--font-ui);
		font-size: 12px;
	}
	.axis-count {
		font-weight: bold;
		color: var(--sel-deep);
	}
	.axis-grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 10px;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	}
	.axis-empty {
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
		.axis-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
