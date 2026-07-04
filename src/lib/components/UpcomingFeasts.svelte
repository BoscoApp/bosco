<script lang="ts">
	import { onMount } from 'svelte';
	import { upcomingFeasts, type LiturgicalDay } from '$lib/calendar';
	import { topicForObservance } from '$lib/content';

	// The Portal look-ahead (#33): the next few notable feasts after today, each linking to its
	// Library article when one has been authored (the same ObservanceId join as Saint-of-the-Day).
	// Computed CLIENT-SIDE on mount from the bundled calendar so it reflects the real date and works
	// offline. Empty (renders nothing) when the visit falls outside the vendored calendar range.
	let feasts = $state<LiturgicalDay[]>([]);

	onMount(() => {
		feasts = upcomingFeasts(new Date());
	});

	// ISO YYYY-MM-DD -> "August 15", built from local components so the label matches the calendar
	// day (no UTC shift). Intl is engine-native — no network, offline-safe.
	function formatDate(iso: string): string {
		const [y, m, d] = iso.split('-').map(Number);
		return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
	}
</script>

{#if feasts.length}
	<section class="upcoming" aria-label="Upcoming feasts">
		<h2>Coming up</h2>
		<ul>
			{#each feasts as feast (feast.date)}
				{@const article = topicForObservance(feast.observanceId)}
				<li>
					<span class="swatch" style="--swatch: var(--lit-{feast.color})" aria-hidden="true"></span>
					<span class="date">{formatDate(feast.date)}</span>
					{#if article}
						<a href="/library/{article.path}/">{feast.feast}</a>
					{:else}
						<span class="name">{feast.feast}</span>
					{/if}
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.upcoming {
		margin-top: var(--space-6);
	}

	.upcoming h2 {
		font-family: var(--font-chrome);
		font-size: var(--font-size-0);
		color: var(--color-accent);
		margin: 0 0 var(--space-3);
	}

	.upcoming ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.upcoming li {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
		font-size: var(--font-size-1);
	}

	.swatch {
		width: 0.7em;
		height: 0.7em;
		border-radius: var(--radius-3);
		background: var(--swatch);
		border: var(--border-width-1) solid var(--color-border);
		flex: none;
		align-self: center;
	}

	.date {
		font-family: var(--font-chrome);
		font-size: var(--font-size-0);
		color: var(--color-text-muted);
		min-width: 7rem;
		flex: none;
	}
</style>
