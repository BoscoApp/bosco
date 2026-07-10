<!--
	"Surprise me" — a link to a random article. It is a REAL <a href>, so it reuses the ordinary link
	machinery: a plain left-click flows through the desktop's in-window intercept (a pure store move, so
	other windows survive) and, on a standalone page, through SvelteKit routing; a middle/modified click
	and a no-JS reader follow the real URL. The href is SEEDED DETERMINISTICALLY (the first topic) so the
	prerendered HTML and client hydration agree — no random value baked at build — then RE-ROLLED on the
	client on focus/pointerdown, which both fire BEFORE the click's navigation reads the href. So a
	keyboard user (focus, then Enter) and a mouse user (pointerdown, then click) each land on a fresh
	random pick with no hydration mismatch. A no-JS reader gets the seeded (first) topic.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { topics } from '$lib/content';

	const hasTopics = topics.length > 0;
	// Deterministic seed for SSR/hydration; re-rolled client-side before activation (see reroll()).
	let pick = $state(topics[0]);
	const href = $derived(hasTopics ? `${base}/library/${pick.category}/${pick.slug}/` : '');

	function reroll() {
		pick = topics[Math.floor(Math.random() * topics.length)];
	}
</script>

{#if hasTopics}
	<a class="surprise" {href} onpointerdown={reroll} onfocus={reroll}>
		<span class="surprise-ic" aria-hidden="true">?</span>
		Surprise me
	</a>
{/if}

<style>
	.surprise {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 5px 12px 5px 8px;
		font-family: var(--font-ui);
		font-size: 12.5px;
		font-weight: bold;
		color: var(--ink);
		text-decoration: none;
		background: var(--surface-titlebar);
		border: 1px solid var(--edge-strong);
		border-radius: 999px;
		box-shadow: var(--shadow-raised);
		transition: transform var(--motion-fast, 120ms) ease;
	}
	.surprise:hover {
		transform: translateY(-1px);
		/* Mix the selection tint into a SOLID token — color-mix() rejects the gradient
		   --surface-titlebar (an <image>), which would blank the fill to transparent. */
		background: color-mix(in srgb, var(--sel) 14%, var(--plat-hi));
	}
	.surprise:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
	}
	.surprise-ic {
		display: grid;
		place-items: center;
		width: 17px;
		height: 17px;
		border-radius: 50%;
		font-size: 12px;
		color: var(--on-sel);
		background: var(--sel-deep);
	}
	@media (prefers-reduced-motion: reduce) {
		.surprise {
			transition: none;
		}
		.surprise:hover {
			transform: none;
		}
	}
</style>
