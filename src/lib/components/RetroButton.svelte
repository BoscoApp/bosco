<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	// Chunky beveled 90s button. Consumes tokens only — no hardcoded colours. All native button
	// attributes (onclick, type, aria-pressed, disabled…) pass straight through.
	let { children, ...rest }: { children: Snippet } & HTMLButtonAttributes = $props();
</script>

<button class="retro-button" {...rest}>
	{@render children()}
</button>

<style>
	.retro-button {
		font-family: var(--font-chrome);
		font-size: var(--font-size-0);
		color: var(--color-text);
		background: var(--color-surface);
		padding: var(--space-1) var(--space-2);
		border: var(--border-width-2) solid var(--color-border);
		border-top-color: var(--bevel-light);
		border-left-color: var(--bevel-light);
		border-bottom-color: var(--bevel-dark);
		border-right-color: var(--bevel-dark);
		border-radius: var(--radius-1);
		cursor: pointer;
		line-height: var(--line-height-tight);
		transition: transform var(--transition-fast);
	}

	.retro-button:hover {
		background: var(--color-bg);
	}

	.retro-button:active {
		border-top-color: var(--bevel-dark);
		border-left-color: var(--bevel-dark);
		border-bottom-color: var(--bevel-light);
		border-right-color: var(--bevel-light);
		transform: translateY(1px);
	}

	.retro-button[aria-pressed='true'] {
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		border-color: var(--color-accent);
	}
</style>
