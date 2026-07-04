<script lang="ts">
	import type { Snippet } from 'svelte';

	// Decorative scrolling marquee — authentically 90s. aria-hidden (it's chrome, not content) and
	// it stops for prefers-reduced-motion (brief §3: no flashing, calm for those who ask). Never a
	// carrier of essential information.
	let { children }: { children: Snippet } = $props();
</script>

<div class="marquee" aria-hidden="true">
	<div class="marquee__track">
		<span>{@render children()}</span>
		<span>{@render children()}</span>
	</div>
</div>

<style>
	.marquee {
		overflow: hidden;
		white-space: nowrap;
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		border-radius: var(--radius-1);
		padding: var(--space-1) 0;
		font-family: var(--font-chrome);
		font-size: var(--font-size-0);
	}

	.marquee__track {
		display: inline-flex;
		gap: var(--space-6);
		padding-left: 100%;
		animation: marquee-scroll 22s linear infinite;
	}

	@keyframes marquee-scroll {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.marquee__track {
			animation: none;
			padding-left: 0;
		}
	}
</style>
