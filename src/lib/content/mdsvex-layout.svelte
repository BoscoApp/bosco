<script>
	// Default mdsvex layout for every rendered article tier. Deliberately minimal: it wraps the
	// markdown body in a readable prose container built from design tokens only. Article chrome
	// (title, tier switch, art frames, "see also") lives on the Library page, not here.
	// mdsvex emits a legacy-mode wrapper; Svelte 5 interop passes its content as `children`.
	let { children } = $props();
</script>

<div class="prose">
	{@render children?.()}
</div>

<style>
	.prose {
		font-family: var(--font-body);
		color: var(--color-text);
		max-width: var(--measure);
		line-height: var(--line-height-relaxed);
	}

	.prose :global(a) {
		color: var(--color-link);
	}
</style>
