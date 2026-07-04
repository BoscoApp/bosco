<script lang="ts">
	import Marquee from '$lib/components/Marquee.svelte';
	import SaintOfTheDay from '$lib/components/SaintOfTheDay.svelte';
	import ArtFrame from '$lib/components/ArtFrame.svelte';

	// The Portal: a tiny web, not an app with tabs (brief §2). Chunky icons to distinct
	// destinations. Art-agnostic — destination art is a placeholder frame until Open Decision #4.
	const destinations = [
		{ href: '/library/', name: 'The Library', blurb: 'A tiered encyclopedia' },
		{ href: '/field-guide/', name: 'The Field Guide', blurb: 'Creatures great and small' },
		{ href: '/chapel/', name: 'The Chapel', blurb: 'Prayers, saints, the calendar' },
		{ href: '/art-studio/', name: 'The Art Studio', blurb: 'Paint and colour' },
		{ href: '/arcade/', name: 'The Arcade', blurb: 'Games to play' },
		{ href: '/typing/', name: 'The Typing Trainer', blurb: 'Learn the keys' }
	];
</script>

<svelte:head>
	<title>Bosco — a little web for Catholic kids</title>
</svelte:head>

<Marquee
	>Welcome to Bosco &bull; A little corner of the web made just for you &bull; Explore and have fun!</Marquee
>

<section class="hero">
	<h1>Bosco</h1>
	<SaintOfTheDay />
</section>

<nav class="portal-grid" aria-label="Destinations">
	{#each destinations as d (d.href)}
		<a class="portal-tile" href={d.href}>
			<ArtFrame label={d.name} ratio="1 / 1" />
			<span class="portal-tile__name">{d.name}</span>
			<span class="portal-tile__blurb">{d.blurb}</span>
		</a>
	{/each}
</nav>

<footer class="portal-footer">
	<span class="hit-counter" aria-hidden="true">Visitors: 000042</span>
	<a href="/search/">Search the Library</a>
</footer>

<style>
	.hero {
		text-align: center;
		margin: var(--space-5) 0;
	}

	.hero h1 {
		font-size: var(--font-size-6);
		color: var(--color-accent);
		margin: 0 0 var(--space-3);
	}

	.portal-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
		gap: var(--space-4);
	}

	.portal-tile {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-3);
		text-decoration: none;
		color: var(--color-text);
		background: var(--color-surface);
		border: var(--border-width-2) solid var(--color-border);
		border-radius: var(--radius-2);
		box-shadow: var(--shadow-1);
		transition: transform var(--transition-fast);
	}

	.portal-tile:hover {
		transform: translateY(-2px);
	}

	.portal-tile__name {
		font-family: var(--font-chrome);
		font-size: var(--font-size-0);
		color: var(--color-accent);
	}

	.portal-tile__blurb {
		font-size: var(--font-size-1);
		color: var(--color-text-muted);
	}

	.portal-footer {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: var(--space-2);
		margin-top: var(--space-6);
		padding-top: var(--space-3);
		border-top: var(--border-width-1) solid var(--color-border);
		font-size: var(--font-size-1);
	}

	.hit-counter {
		font-family: var(--font-chrome);
		font-size: var(--font-size-0);
		color: var(--color-text-muted);
	}
</style>
