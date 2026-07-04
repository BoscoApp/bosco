<script lang="ts">
	import RetroWindow from '$lib/components/RetroWindow.svelte';

	// Styled 404. nginx serves this file (as 404.html) for any unknown path, so it renders inside
	// the normal Clubhouse chrome and always offers a way back to the Portal. data-pagefind-ignore
	// keeps the error page out of the offline search index.
</script>

<svelte:head><title>Page not found — Bosco</title></svelte:head>

<div class="not-found" data-pagefind-ignore>
	<RetroWindow title="404 — Page Not Found">
		<p class="lead">Uh oh! This page wandered off the map.</p>
		<p>
			The page you were looking for isn't here. Maybe it moved, or maybe the address had a little
			typo in it. That happens to everyone!
		</p>
		<p><a href="/">← Back to the Portal</a></p>
	</RetroWindow>
</div>

<style>
	.not-found {
		max-width: 40rem;
		margin-inline: auto;
	}

	.lead {
		font-size: var(--font-size-4);
		color: var(--color-accent);
		line-height: var(--line-height-tight);
		margin-bottom: var(--space-3);
	}
</style>
