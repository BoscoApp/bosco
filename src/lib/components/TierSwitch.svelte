<script lang="ts">
	import { settings } from '$lib/state/store.svelte';
	import { TIER_ORDER, TIER_LABEL } from '$lib/content/tiers';

	// The global reading-level switch (brief §2.8). Lives in the header on every page. A real
	// button group, keyboard-operable, with aria-pressed state. Writes straight to the one state
	// module; every tier-aware surface reacts.
</script>

<fieldset class="tier-switch">
	<legend class="visually-hidden">Reading level</legend>
	{#each TIER_ORDER as tier (tier)}
		<button
			type="button"
			class="tier-option"
			aria-pressed={settings.tier === tier}
			onclick={() => (settings.tier = tier)}
		>
			{TIER_LABEL[tier]}
		</button>
	{/each}
</fieldset>

<style>
	.tier-switch {
		display: inline-flex;
		gap: var(--space-0);
		margin: 0;
		padding: 0;
		border: 0;
	}

	.tier-option {
		font-family: var(--font-chrome);
		font-size: var(--font-size-0);
		color: var(--color-text);
		background: var(--color-surface);
		border: var(--border-width-1) solid var(--color-border);
		padding: var(--space-1) var(--space-2);
		cursor: pointer;
	}

	.tier-option[aria-pressed='true'] {
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		border-color: var(--color-accent);
	}
</style>
