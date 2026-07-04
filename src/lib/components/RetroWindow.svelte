<script lang="ts">
	import type { Snippet } from 'svelte';

	// A 90s window frame with a title bar. Tokens only.
	let { title, children }: { title: string; children: Snippet } = $props();
</script>

<section class="retro-window">
	<header class="retro-window__bar">
		<span class="retro-window__title">{title}</span>
	</header>
	<div class="retro-window__body">
		{@render children()}
	</div>
</section>

<style>
	.retro-window {
		border: var(--border-width-2) solid var(--color-border);
		border-top-color: var(--bevel-light);
		border-left-color: var(--bevel-light);
		border-bottom-color: var(--bevel-dark);
		border-right-color: var(--bevel-dark);
		border-radius: var(--radius-2);
		background: var(--color-surface);
		box-shadow: var(--shadow-2);
		overflow: hidden;
	}

	.retro-window__bar {
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		padding: var(--space-1) var(--space-2);
	}

	.retro-window__title {
		font-family: var(--font-chrome);
		font-size: var(--font-size-0);
	}

	.retro-window__body {
		padding: var(--space-4);
	}
</style>
