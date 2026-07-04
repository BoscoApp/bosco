<script lang="ts">
	import { CATEGORY_LABEL } from '$lib/content/schema';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const label = $derived(CATEGORY_LABEL[data.category]);
</script>

<svelte:head><title>{label} — The Library — Bosco</title></svelte:head>

<p><a href="/library/">← The Library</a></p>
<h1>{label}</h1>

{#if data.topics.length}
	<ul>
		{#each data.topics as t (t.path)}
			<li>
				<a href="/library/{t.path}/">{t.title}</a>
				{#if t.summary}<span class="summary"> — {t.summary}</span>{/if}
			</li>
		{/each}
	</ul>
{:else}
	<p class="empty">No topics here yet — check back soon.</p>
{/if}

<style>
	.summary {
		color: var(--color-text-muted);
	}

	.empty {
		color: var(--color-text-muted);
	}
</style>
