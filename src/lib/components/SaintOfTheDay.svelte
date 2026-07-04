<script lang="ts">
	import { onMount } from 'svelte';
	import { getToday, saintOfDayLabel, type LiturgicalDay } from '$lib/calendar';

	// Saint-of-the-Day + season, computed CLIENT-SIDE on mount from the bundled 1962 calendar JSON
	// (brief §2.1). Computing on mount (not at prerender) means it reflects the day the child
	// actually visits, and it works fully offline. It also sets the liturgical accent colour for
	// the whole page via <html data-lit>.
	let day = $state<LiturgicalDay | null>(null);

	onMount(() => {
		day = getToday();
		if (day) document.documentElement.setAttribute('data-lit', day.color);
	});
</script>

<div class="saint-of-day">
	{#if day}
		<p class="saint-of-day__feast">{saintOfDayLabel(day)}</p>
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
		font-weight: 700;
		font-size: var(--font-size-3);
		margin: 0;
		color: var(--color-text);
	}

	.saint-of-day__season {
		margin: var(--space-0) 0 0;
		color: var(--color-text-muted);
		font-size: var(--font-size-1);
	}
</style>
