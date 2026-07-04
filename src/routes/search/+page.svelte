<script lang="ts">
	import { onMount } from 'svelte';
	import '@pagefind/default-ui/css/ui.css';

	// Pagefind search UI. The index and JS are static files built into /pagefind/ at build time and
	// served same-origin — fully client-side, zero network (offline in Docker). The module is
	// imported dynamically on mount so nothing runs during prerender; search is therefore inactive
	// in `vite dev` and active only after `npm run build` (or in the Docker image).
	onMount(async () => {
		const { PagefindUI } = await import('@pagefind/default-ui');
		new PagefindUI({
			element: '#search',
			bundlePath: '/pagefind/',
			showSubResults: true,
			showImages: false
		});
	});
</script>

<svelte:head><title>Search — Bosco</title></svelte:head>

<h1>Search the Library</h1>
<p data-pagefind-ignore>
	Search runs in the built site and offline in Docker. It is inactive in dev.
</p>
<div id="search"></div>

<style>
	/*
	 * Token-theme the bundled Pagefind default-ui (brief §3 — everything wears the Clubhouse skin).
	 * We only remap Pagefind's OWN CSS variables (see @pagefind/default-ui/css/ui.css) onto Bosco
	 * semantic tokens — no new assets, no external fonts, so the offline invariant is untouched.
	 * Setting them on #search (the mount target) scopes the theme to the injected widget and lets it
	 * follow the active theme + liturgical accent. `--pagefind-ui-primary` maps to the stable link
	 * colour, not the accent, so search stays legible under every liturgical colour (white/gold too).
	 */
	#search {
		--pagefind-ui-primary: var(--color-link);
		--pagefind-ui-text: var(--color-text);
		--pagefind-ui-background: var(--color-surface);
		--pagefind-ui-border: var(--color-border);
		--pagefind-ui-tag: var(--color-bg);
		--pagefind-ui-border-width: var(--border-width-2);
		--pagefind-ui-border-radius: var(--radius-3);
		--pagefind-ui-image-border-radius: var(--radius-3);
		--pagefind-ui-font: var(--font-body);
	}
</style>
