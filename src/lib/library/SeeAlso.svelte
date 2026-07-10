<!--
	"See also" — the curated cross-links at the foot of an article. Driven by the topic's `related`
	frontmatter, which the content plugin validates at build time (every entry resolves to another
	topic that ships in this build), so the paths here always resolve. Host-agnostic: it renders the
	same TopicCard links used everywhere else, so the desktop's delegated click handler opens them
	in-window while deep links / no-JS follow the real prerendered route. Renders nothing when a topic
	has no related links.
-->
<script lang="ts">
	import { getTopic, type Topic, type Category } from '$lib/content';
	import TopicCard from './TopicCard.svelte';

	let {
		topic,
		headingLevel = 2
	}: {
		topic: Topic;
		/** The article title is h{level}; "See also" is a subsection, so hosts pass level + 1. */
		headingLevel?: number;
	} = $props();

	// Resolve each `category/slug` to its Topic. Validated at build time, but filter defensively so a
	// future change can never render a broken card.
	const related = $derived(
		topic.related
			.map((path) => {
				const [category, slug] = path.split('/');
				return getTopic(category as Category, slug);
			})
			.filter((t): t is Topic => t !== undefined)
	);
</script>

{#if related.length}
	<section class="see-also" aria-labelledby="see-also-heading-{topic.slug}">
		<svelte:element this={`h${headingLevel}`} id="see-also-heading-{topic.slug}" class="sa-title">
			See also
		</svelte:element>
		<ul class="sa-grid">
			{#each related as t (t.path)}
				<li><TopicCard topic={t} /></li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.see-also {
		margin-top: 22px;
		padding-top: 14px;
		border-top: 1px solid var(--line-soft);
	}
	.sa-title {
		margin: 0 0 10px;
		font-family: var(--font-ui);
		font-size: 13px;
		font-weight: bold;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--ink-soft);
	}
	.sa-grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 10px;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	}
	@media (max-width: 420px) {
		.sa-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
