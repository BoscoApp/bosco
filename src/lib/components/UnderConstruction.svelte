<script lang="ts">
	import RetroWindow from '$lib/components/RetroWindow.svelte';

	// Placeholder for destinations that arrive in later phases. Authentically 90s "under
	// construction" — used sparingly (brief §3).
	let { title }: { title: string } = $props();
</script>

<RetroWindow {title}>
	<p>This corner of Bosco is still being built. Come back soon!</p>
	<p class="construction" aria-hidden="true">🚧 Under construction 🚧</p>
	<p><a href="/">← Back to the Portal</a></p>
</RetroWindow>

<style>
	.construction {
		font-family: var(--font-chrome);
		font-size: var(--font-size-0);
		color: var(--color-text-muted);
	}
</style>
