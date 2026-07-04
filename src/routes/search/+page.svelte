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
