<!--
	The Field Guide's hub: every published creature, laid out BOTH ways at once — by habitat, then by
	kind. Host-agnostic (renders on the prerendered /field-guide/ page and inside the desktop window),
	so the whole index is complete with no JS. Every creature is a real <a href> to its existing Library
	article; the desktop intercepts plain left-clicks to open it in-window. Reads no album/profile state
	— browsing here is not a checklist.
-->
<script lang="ts">
	import { topicsByCategory } from '$lib/content';
	import { groupByHabitat, groupByKind } from './axes';
	import TopicCard from '$lib/library/TopicCard.svelte';

	/** Heading level: 1 on the standalone /field-guide page, 2 inside a desktop window. */
	let { level = 1 }: { level?: 1 | 2 } = $props();

	const creatures = $derived(topicsByCategory('creatures'));
	const byHabitat = $derived(groupByHabitat(creatures));
	const byKind = $derived(groupByKind(creatures));

	// Heading levels cascade from the view's level with no skips (a11y): title → axis → group.
	const axisLevel = $derived(level + 1);
	const groupLevel = $derived(level + 2);
</script>

<div class="fg-home" data-pagefind-ignore>
	<header class="fg-head">
		<p class="fg-kicker">Creatures</p>
		<svelte:element this={`h${level}`} class="fg-title" data-view-heading tabindex="-1">
			The Field Guide
		</svelte:element>
		<p class="fg-blurb">
			Every creature in the Library, sorted two ways — by where it lives and by what kind it is.
		</p>
	</header>

	{#if creatures.length}
		<section class="fg-axis">
			<svelte:element this={`h${axisLevel}`} class="fg-axis-title">By habitat</svelte:element>
			{#each byHabitat as group (group.value)}
				<div class="fg-group">
					<svelte:element this={`h${groupLevel}`} class="fg-group-title"
						>{group.label}</svelte:element
					>
					<ul class="fg-grid">
						{#each group.topics as topic (topic.path)}
							<li><TopicCard {topic} /></li>
						{/each}
					</ul>
				</div>
			{/each}
		</section>

		<section class="fg-axis">
			<svelte:element this={`h${axisLevel}`} class="fg-axis-title">By kind</svelte:element>
			{#each byKind as group (group.value)}
				<div class="fg-group">
					<svelte:element this={`h${groupLevel}`} class="fg-group-title"
						>{group.label}</svelte:element
					>
					<ul class="fg-grid">
						{#each group.topics as topic (topic.path)}
							<li><TopicCard {topic} /></li>
						{/each}
					</ul>
				</div>
			{/each}
		</section>
	{:else}
		<p class="fg-empty">
			The Field Guide is still being stocked — creature articles are on their way.
		</p>
	{/if}
</div>

<style>
	.fg-home {
		display: flex;
		flex-direction: column;
	}
	.fg-head {
		margin-bottom: 8px;
	}
	.fg-kicker {
		margin: 0 0 2px;
		font-family: var(--font-ui);
		font-size: 11.5px;
		font-weight: bold;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		/* --ink-green is the AA-contrast partner for green text on paper (raw --green fails). */
		color: var(--ink-green);
	}
	.fg-title {
		margin: 0 0 4px;
		font-family: var(--font-display);
		font-size: 24px;
		line-height: 1.1;
		color: var(--ink);
	}
	.fg-title:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 3px;
		border-radius: 3px;
	}
	.fg-blurb {
		margin: 0;
		max-width: 46ch;
		font-family: var(--font-body);
		font-size: 13.5px;
		line-height: 1.5;
		color: var(--ink-soft);
	}
	.fg-axis {
		margin-top: 20px;
	}
	.fg-axis-title {
		margin: 0 0 4px;
		padding-bottom: 4px;
		font-family: var(--font-display);
		font-size: 17px;
		color: var(--ink);
		border-bottom: 1px solid var(--line-soft);
	}
	.fg-group {
		margin-top: 12px;
	}
	.fg-group-title {
		margin: 0 0 8px;
		font-family: var(--font-ui);
		font-size: 13px;
		font-weight: bold;
		color: var(--sel-deep);
	}
	.fg-grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 10px;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	}
	.fg-empty {
		margin: 12px 0 0;
		padding: 18px;
		font-family: var(--font-body);
		font-size: 13.5px;
		color: var(--ink-soft);
		background: color-mix(in srgb, var(--ink) 5%, var(--paper));
		border: 1px dashed var(--line-soft);
		border-radius: var(--radius-sm);
	}
	@media (max-width: 420px) {
		.fg-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
