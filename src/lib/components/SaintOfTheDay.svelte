<script lang="ts">
	import { onMount } from 'svelte';
	import { getToday, saintOfDayLabel, type LiturgicalDay } from '$lib/calendar';
	import { topicForObservance } from '$lib/content';
	import type { Topic } from '$lib/content';

	// Saint-of-the-Day + season, computed CLIENT-SIDE on mount from the bundled 1962 calendar JSON
	// (brief §2.1). Computing on mount (not at prerender) means it reflects the day the child
	// actually visits, and it works fully offline. When the day's feast has a Library Faith article
	// (the ObservanceId join, #31), its name becomes a link into the Library. The whole-app
	// liturgical accent is set once in the root layout, not here.
	let day = $state<LiturgicalDay | null>(null);
	let article = $state<Topic | undefined>(undefined);

	onMount(() => {
		day = getToday();
		article = day ? topicForObservance(day.observanceId) : undefined;
	});
</script>

<div class="saint-of-day">
	{#if day}
		<p class="saint-of-day__feast">
			<span class="swatch" style="--swatch: var(--lit-{day.color})" aria-hidden="true"></span>
			{#if article}
				<a href="/library/{article.path}/">{saintOfDayLabel(day)}</a>
			{:else}
				{saintOfDayLabel(day)}
			{/if}
		</p>
		<p class="saint-of-day__season">{day.season}</p>
	{:else}
		<p class="saint-of-day__season">Loading today's calendar…</p>
	{/if}
</div>

<style>
	.saint-of-day {
		text-align: center;
	}

	.saint-of-day__feast {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		font-weight: 700;
		font-size: var(--font-size-3);
		margin: 0;
		color: var(--color-text);
	}

	/* The day's liturgical colour, shown as a small coin so the accent reads as *meaning* (the
	   Church's colour for today), not decoration. Bordered so pale colours (white/gold) stay visible. */
	.swatch {
		width: 0.85em;
		height: 0.85em;
		border-radius: var(--radius-3);
		background: var(--swatch);
		border: var(--border-width-1) solid var(--color-border);
		flex: none;
	}

	.saint-of-day__season {
		margin: var(--space-0) 0 0;
		color: var(--color-text-muted);
		font-size: var(--font-size-1);
	}
</style>
