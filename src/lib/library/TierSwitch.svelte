<!--
	The reading-level control that sits on an article. It is a single-select of the three tiers, with
	the tiers a topic doesn't offer shown disabled. It is host-agnostic: the parent decides what the
	value means (a per-article override in the Library, or the global default in Settings) by handling
	`onchange`. Colours come from tokens; focus uses the app's two-tone ring.
-->
<script lang="ts">
	import type { Tier } from '$lib/content';
	import { TIER_LABEL, TIER_HINT, ALL_TIERS } from './tiers';

	let {
		available,
		value,
		onchange,
		overridden = false
	}: {
		available: Tier[];
		value: Tier;
		onchange: (t: Tier) => void;
		/** True when `value` is a per-article override rather than the reader's usual level. */
		overridden?: boolean;
	} = $props();
</script>

<div class="tierswitch">
	<span class="ts-label" id="ts-label">Read as</span>
	<div class="ts-seg" role="group" aria-labelledby="ts-label">
		{#each ALL_TIERS as t (t)}
			{@const on = t === value}
			{@const has = available.includes(t)}
			<button
				type="button"
				class="ts-opt"
				class:on
				aria-pressed={on}
				disabled={!has}
				title={has ? TIER_HINT[t] : `${TIER_LABEL[t]} isn’t written for this topic yet`}
				onclick={() => has && !on && onchange(t)}
			>
				{TIER_LABEL[t]}
			</button>
		{/each}
	</div>
	<span class="ts-hint">{overridden ? 'just for this page' : TIER_HINT[value]}</span>
</div>

<style>
	.tierswitch {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px 10px;
		font-family: var(--font-ui);
	}
	.ts-label {
		font-size: 12px;
		font-weight: bold;
		color: var(--ink-soft);
	}
	.ts-seg {
		display: inline-flex;
		border: 1px solid var(--edge-strong);
		border-radius: 7px;
		overflow: hidden;
		background: var(--surface-titlebar);
	}
	.ts-opt {
		appearance: none;
		border: none;
		border-left: 1px solid var(--edge);
		padding: 5px 11px;
		font: inherit;
		font-size: 12.5px;
		color: var(--ink);
		background: transparent;
		cursor: pointer;
	}
	.ts-opt:first-child {
		border-left: none;
	}
	.ts-opt:hover:not(:disabled):not(.on) {
		background: color-mix(in srgb, var(--sel) 14%, transparent);
	}
	.ts-opt.on {
		color: #ffffff;
		background: linear-gradient(color-mix(in srgb, var(--sel) 82%, #ffffff), var(--sel-deep));
		font-weight: bold;
	}
	.ts-opt:disabled {
		color: color-mix(in srgb, var(--ink) 34%, var(--paper));
		cursor: not-allowed;
	}
	/* Two-tone focus ring, contrast-safe on the light segment and the selected gradient alike. */
	.ts-opt:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: -4px;
		box-shadow: inset 0 0 0 2px var(--focus-inverse);
	}
	.ts-hint {
		font-size: 11.5px;
		color: var(--ink-soft);
	}
</style>
