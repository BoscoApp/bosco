<script lang="ts">
	import { topicsByCategory } from '$lib/content';
	import { CATEGORIES } from '$lib/content/schema';

	const categoryLabels: Record<string, string> = {
		creatures: 'Creatures',
		faith: 'Faith',
		world: 'World'
	};
</script>

<svelte:head><title>The Library — Bosco</title></svelte:head>

<h1>The Library</h1>
<p>Every topic at three reading levels. Use the reading-level switch at the top of the page.</p>

{#each CATEGORIES as cat (cat)}
	{@const list = topicsByCategory(cat)}
	{#if list.length}
		<section class="category">
			<h2>{categoryLabels[cat]}</h2>
			<ul>
				{#each list as t (t.slug)}
					<li>
						<a href="/library/{t.path}/">{t.frontmatter.title}</a>
						{#if t.frontmatter.summary}<span class="summary"> — {t.frontmatter.summary}</span>{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}
{/each}

<p><a href="/search/">Search the Library</a></p>

<style>
	.summary {
		color: var(--color-text-muted);
	}
</style>
