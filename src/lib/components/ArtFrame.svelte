<script lang="ts">
	// Art-agnostic placeholder frame. The illustration treatment (Open Decision #4) is deferred,
	// so NO content illustrations are generated or committed in Phase 0 — layouts reserve their
	// media slots with this labeled frame instead. Swap the internals once #4 is picked.
	let { label = 'Illustration', ratio = '4 / 3' }: { label?: string; ratio?: string } = $props();
</script>

<div
	class="art-frame"
	style="aspect-ratio: {ratio}"
	role="img"
	aria-label="Placeholder for {label}"
>
	<span class="art-frame__mark" aria-hidden="true">✦</span>
	<span class="art-frame__label">{label}</span>
</div>

<style>
	.art-frame {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
		width: 100%;
		border: var(--border-width-2) dashed var(--color-border);
		border-radius: var(--radius-2);
		background: var(--color-surface);
		color: var(--color-text-muted);
		padding: var(--space-3);
		text-align: center;
	}

	.art-frame__mark {
		font-size: var(--font-size-5);
		color: var(--color-accent);
	}

	.art-frame__label {
		font-size: var(--font-size-0);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
</style>
