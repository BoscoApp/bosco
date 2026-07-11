<!--
	An art-agnostic placeholder frame — the seam where a real illustration will land later, WITHOUT
	choosing an aesthetic today (Decision #4 is the owner's, on real proof assets that don't exist yet).
	It draws nothing but a token-styled, faintly hatched "reserved" box: no <img>, no URL, no media
	variant, no animation. Purely decorative, so it is aria-hidden — a screen reader never announces an
	empty picture. `label` is carried for the future real image's alt text; it is intentionally NOT
	rendered here (that would just repeat the heading it sits beside).

	When illustrations arrive, a theme-aware <Illustration> component will resolve the active theme's
	media[] variant and render <img src alt>, falling back to this frame when a topic has no asset — so
	call sites swap <ArtFrame …> → <Illustration …> with no layout change.
-->
<script lang="ts">
	let {
		label = '',
		ratio = '4 / 1',
		accent = 'var(--line)',
		/** Mirrors mediaSchema.kind so a real variant can key off it later; unused while empty. */
		kind = 'illustration'
	}: {
		label?: string;
		ratio?: string;
		accent?: string;
		kind?: 'illustration' | 'photo' | 'diagram' | 'map';
	} = $props();
</script>

<div
	class="art-frame"
	aria-hidden="true"
	data-kind={kind}
	data-label={label || undefined}
	style="--art-ratio: {ratio}; --art-accent: {accent};"
></div>

<style>
	.art-frame {
		aspect-ratio: var(--art-ratio, 4 / 1);
		width: 100%;
		max-width: 100%;
		border: 1px solid color-mix(in srgb, var(--art-accent, var(--line)) 38%, var(--paper));
		border-radius: var(--radius-sm);
		/* A faint tint plus a subtle diagonal hatch reads unmistakably as "reserved for art", never as a
		   broken image — and stays retro. All colour derives from tokens / the passed accent token. */
		background:
			repeating-linear-gradient(
				45deg,
				color-mix(in srgb, var(--art-accent, var(--line)) 12%, transparent) 0 2px,
				transparent 2px 8px
			),
			color-mix(in srgb, var(--art-accent, var(--line)) 7%, var(--paper));
	}
</style>
