<!--
	The card album — the reader's OWN quiet record of the creatures they've met. Records, not rewards:
	a calm grid of the creatures this profile has read about, in alphabetical order, with NO count, NO
	percent, NO "collected 5 of 18", NO streak/score/rarity. (That stance is gate-enforced — see
	album.gate.test.ts.) Each card's title, summary, and art are joined from LIVE gated frontmatter at
	view time, so a creature that is later un-approved resolves to an inert frame that never leaks its
	former title.

	A JS-only convenience surface: the album's data is profile-scoped client IndexedDB and recording is
	itself JS-only, so there is deliberately no prerendered /field-guide/album route — this renders only
	inside the desktop Field Guide window, reached through the FieldGuideBrowser store. It is the one
	Field Guide surface that reads $lib/state; the browse index stays state-free.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { getStore, listCards } from '$lib/state';
	import { getTopic, type Topic } from '$lib/content';
	import { buildAlbum, type AlbumEntry } from './album-cards';
	import ArtFrame from '$lib/library/ArtFrame.svelte';

	/** Heading level: 2 inside a desktop window (the only host — there is no standalone album route). */
	let { level = 2 }: { level?: 1 | 2 } = $props();

	// 'loading' until the one client read finishes, then 'no-profile' or 'ready'. Because the album is
	// JS-only and only ever mounts client-side inside the window, the loading state is momentary.
	let status = $state<'loading' | 'no-profile' | 'ready'>('loading');
	let cards = $state<AlbumEntry<Topic>[]>([]);

	// One pinned line under the title, per state. Kept as literal copy (no count/number) so the merge
	// gate reviews a diff, not a vibe.
	const blurb = $derived(
		status === 'no-profile'
			? 'Make a profile to start your own album.'
			: 'Creatures you’ve read about show up here.'
	);

	onMount(async () => {
		if (!browser) return;
		const store = getStore();
		if (!store.activeProfile) {
			status = 'no-profile';
			return;
		}
		const slugs = await listCards(store);
		cards = buildAlbum<Topic>(slugs, (slug) => getTopic('creatures', slug));
		status = 'ready';
	});
</script>

<section class="album">
	<header class="al-head">
		<p class="al-kicker">Field Guide</p>
		<svelte:element this={`h${level}`} class="al-title" data-view-heading tabindex="-1">
			My album
		</svelte:element>
		<p class="al-blurb">{blurb}</p>
	</header>

	{#if status === 'ready' && cards.length}
		<ul class="al-grid">
			{#each cards as entry (entry.slug)}
				<li>
					{#if entry.topic}
						<a class="al-card" href="{base}/library/creatures/{entry.topic.slug}/">
							<ArtFrame
								kind="illustration"
								accent="var(--green)"
								ratio="3 / 2"
								label={entry.topic.title}
							/>
							<span class="al-card-title">{entry.topic.title}</span>
							<span class="al-card-summary">{entry.topic.summary}</span>
						</a>
					{:else}
						<!-- Recorded, but its creature is not currently in the Library: an inert frame that shows
						     no title (never leaks a formerly-approved name) and links nowhere. -->
						<div class="al-card is-inert">
							<ArtFrame kind="illustration" ratio="3 / 2" />
							<span class="al-card-note">This creature isn’t in the Library right now.</span>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.album {
		display: flex;
		flex-direction: column;
	}
	.al-head {
		margin-bottom: 8px;
	}
	.al-kicker {
		margin: 0 0 2px;
		font-family: var(--font-ui);
		font-size: 11.5px;
		font-weight: bold;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		/* AA-contrast partner for green text on paper (raw --green fails). */
		color: var(--ink-green);
	}
	.al-title {
		margin: 0 0 4px;
		font-family: var(--font-display);
		font-size: 22px;
		line-height: 1.1;
		color: var(--ink);
	}
	.al-title:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 3px;
		border-radius: 3px;
	}
	.al-blurb {
		margin: 0;
		max-width: 46ch;
		font-family: var(--font-body);
		font-size: 13.5px;
		line-height: 1.5;
		color: var(--ink-soft);
	}
	.al-grid {
		list-style: none;
		margin: 16px 0 0;
		padding: 0;
		display: grid;
		gap: 12px;
		grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
	}
	.al-card {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 10px;
		text-decoration: none;
		background: var(--surface-card);
		border: 1px solid var(--line-card);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-raised);
		transition: transform var(--motion-fast, 120ms) ease;
	}
	a.al-card:hover {
		transform: translateY(-1px);
		border-color: var(--edge-strong);
	}
	a.al-card:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
	}
	.al-card-title {
		font-family: var(--font-ui);
		font-weight: bold;
		font-size: 14px;
		color: var(--ink);
	}
	.al-card-summary {
		font-size: 12.5px;
		line-height: 1.4;
		color: var(--ink-soft);
	}
	.al-card.is-inert {
		cursor: default;
	}
	.al-card-note {
		font-family: var(--font-body);
		font-size: 12.5px;
		line-height: 1.4;
		color: var(--ink-soft);
	}
	@media (max-width: 420px) {
		.al-grid {
			grid-template-columns: 1fr;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.al-card {
			transition: none;
		}
		a.al-card:hover {
			transform: none;
		}
	}
</style>
