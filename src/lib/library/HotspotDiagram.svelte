<!--
	The anatomy hotspot diagram (v0.4.0 FG-6). SVG/DOM, never PixiJS: it instantiates no canvas, so it
	renders whole at prerender with no `{#if browser}` gate and stays readable with JS off.

	The teaching content is the hotspot BLURBS, so — unlike a glossary term, which annotates prose that
	stays legible on its own — the blurbs are baked into a real, complete `<dl>` UNCONDITIONALLY. A no-JS
	or print reader gets every fact; a screen-reader user gets each pin's label as its accessible name
	(`aria-label`) and its fact as an `aria-describedby` pointer at the already-present blurb. The base
	plate is an ArtFrame placeholder (Decision #4 — real illustration deferred to the owner); the pins are
	positioned by PERCENTAGE, so they line up once the art lands with no code change. The pin↔row
	highlight is pure enhancement layered on that DOM by `attachHotspots`; reduced motion keeps the
	highlight and drops the transition.
-->
<script lang="ts">
	import type { Topic } from '$lib/content';
	import ArtFrame from './ArtFrame.svelte';
	import { attachHotspots } from './hotspot-diagram';

	let { topic, headingLevel = 2 }: { topic: Topic; headingLevel?: number } = $props();

	const anatomy = $derived(topic.anatomy);
	// The base-plate media entry (validated to exist + be a `diagram` at build time). Its alt seeds the
	// future real illustration's alt text; today ArtFrame draws only a placeholder, so nothing loads.
	const plateAlt = $derived(
		topic.media.find((m) => m.id === anatomy?.diagram)?.variants[0]?.alt ?? ''
	);

	// A stable, unique id base for the aria-describedby wiring, namespaced by the topic path so two
	// articles on one page could never collide on a blurb id.
	const idBase = $derived(`hs-${topic.path.replace(/[^a-z0-9]+/gi, '-')}`);
	const blurbId = (id: string) => `${idBase}-${id}-blurb`;

	let rootEl = $state<HTMLElement | null>(null);
	$effect(() => {
		if (rootEl) return attachHotspots(rootEl);
	});
</script>

{#if anatomy}
	<section class="hotspot" bind:this={rootEl}>
		<svelte:element this={`h${headingLevel}`} class="hs-title">Body parts to know</svelte:element>

		<figure class="hs-figure">
			<div class="hs-plate">
				<ArtFrame kind="diagram" ratio="3 / 2" label={plateAlt} accent="var(--green)" />
				{#each anatomy.hotspots as h (h.id)}
					<button
						type="button"
						class="hs-pin"
						style="left: {h.x}%; top: {h.y}%;"
						data-hotspot={h.id}
						aria-label={h.label}
						aria-describedby={blurbId(h.id)}
					>
						<span class="hs-dot" aria-hidden="true"></span>
					</button>
				{/each}
			</div>
		</figure>

		<dl class="hs-list">
			{#each anatomy.hotspots as h (h.id)}
				<div class="hs-row" data-hotspot-row={h.id}>
					<dt class="hs-label">{h.label}</dt>
					<dd class="hs-blurb" id={blurbId(h.id)}>{h.blurb}</dd>
				</div>
			{/each}
		</dl>
	</section>
{/if}

<style>
	.hotspot {
		margin-top: 22px;
		padding-top: 14px;
		border-top: 1px dashed var(--line-soft);
	}
	.hs-title {
		margin: 0 0 12px;
		font-family: var(--font-display);
		font-size: calc(16px * var(--type-scale, 1));
		line-height: 1.2;
		color: var(--ink);
	}
	.hs-figure {
		margin: 0 0 14px;
	}
	.hs-plate {
		position: relative;
		width: 100%;
	}

	/* Pins overlay the plate at their percentage coords, centred on the point. A generous hit target
	   (>= 24px, the a11y-floor minimum) around a small visible dot. */
	.hs-pin {
		position: absolute;
		transform: translate(-50%, -50%);
		width: 28px;
		height: 28px;
		display: grid;
		place-items: center;
		margin: 0;
		padding: 0;
		border: 0;
		background: none;
		border-radius: 50%;
		cursor: pointer;
		color: var(--sel-deep);
	}
	.hs-dot {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--surface-card);
		border: 3px solid currentColor;
		box-shadow: var(--shadow-pop);
		transition:
			transform var(--motion-fast) ease,
			background var(--motion-fast) ease;
	}
	/* Hover or keyboard focus, plus the JS cross-highlight from a hovered/focused list row. `.is-active`
	   is added at runtime by attachHotspots, so it is `:global` (Svelte's used-selector analysis can't
	   see a class it never renders — the `[data-gloss-ready]` precedent), while `.hs-pin`/`.hs-dot` stay
	   component-scoped. */
	.hs-pin:hover .hs-dot,
	.hs-pin:focus-visible .hs-dot,
	.hs-pin:global(.is-active) .hs-dot {
		background: var(--sel-deep);
		transform: scale(1.3);
	}
	.hs-pin:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
	}

	.hs-list {
		margin: 0;
		display: grid;
		gap: 8px;
	}
	.hs-row {
		padding: 8px 10px;
		border: 1px solid var(--line-soft);
		border-radius: var(--radius-sm);
		background: var(--paper);
		transition: background var(--motion-fast) ease;
	}
	.hs-row:global(.is-active) {
		background: var(--tint-green);
		border-color: color-mix(in srgb, var(--green) 30%, var(--paper));
	}
	.hs-label {
		margin: 0 0 2px;
		font-family: var(--font-ui);
		font-weight: bold;
		font-size: 13px;
		color: var(--ink);
	}
	.hs-blurb {
		margin: 0;
		font-family: var(--font-body);
		font-size: 13.5px;
		line-height: 1.5;
		color: var(--ink-soft);
	}

	/* Honour reduced-motion: keep the highlight (colour), drop the movement. */
	@media (prefers-reduced-motion: reduce) {
		.hs-dot,
		.hs-row {
			transition: none;
		}
		.hs-pin:hover .hs-dot,
		.hs-pin:focus-visible .hs-dot,
		.hs-pin:global(.is-active) .hs-dot {
			transform: none;
		}
	}
</style>
