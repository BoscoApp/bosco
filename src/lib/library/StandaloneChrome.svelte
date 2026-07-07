<!--
	The frame for a Library page visited on its own (a deep link, a search hit, or a no-JS reader) —
	the canonical, prerendered face of a topic or category. It sets the scene on the liturgical
	wallpaper, wraps the content in a retro window, and offers a way back into the desktop. Inside the
	Bosco desktop these same views render windowless via the shared components; this is the standalone
	host. Colours are all tokens; the wallpaper matches today's colour once JS resolves the calendar.
-->
<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { base } from '$app/paths';
	import { resolveToday } from '$lib/portal/liturgy';

	let { title, children }: { title: string; children: Snippet } = $props();

	// Match the desktop's wallpaper to today's liturgical colour (client-only; prerender keeps the
	// app.html default so the page is never colourless offline).
	onMount(() => {
		document.documentElement.setAttribute('data-lit', resolveToday().litKey);
	});
</script>

<main class="sc-scene">
	<div class="sc-window">
		<div class="sc-title">
			<span class="sc-title-name">{title} — bosco.kids</span>
			<span class="sc-title-fill" aria-hidden="true"></span>
		</div>
		<div class="sc-body">
			{@render children()}
		</div>
	</div>
	<p class="sc-foot">
		<a class="sc-home" href="{base}/">&larr; Open in Bosco</a>
		<span aria-hidden="true"> · </span>Made with love for God’s children
	</p>
</main>

<style>
	.sc-scene {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		min-height: 100vh;
		padding: 24px 16px 32px;
		background: radial-gradient(
			135% 115% at 50% -12%,
			color-mix(in srgb, var(--lit) 78%, #ffffff) 0%,
			var(--lit) 44%,
			var(--lit-dk) 100%
		);
	}
	.sc-window {
		width: min(720px, 100%);
		margin-top: 12px;
		background: var(--window-bg);
		border: 1px solid var(--edge-strong);
		border-radius: 7px 7px 4px 4px;
		box-shadow: var(--shadow-win);
	}
	.sc-title {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 24px;
		padding: 0 10px;
		border-radius: 6px 6px 0 0;
		border-bottom: 1px solid var(--edge);
		background: var(--surface-titlebar);
		font-family: var(--font-ui);
		font-size: 12px;
		font-weight: bold;
		color: var(--ink);
	}
	.sc-title-fill {
		flex: 1 1 auto;
		height: 11px;
		opacity: 0.45;
		background: repeating-linear-gradient(var(--tb-stripe) 0 1px, transparent 1px 3px);
	}
	.sc-body {
		margin: 3px;
		padding: 22px 22px 26px;
		background: var(--paper);
		border: 1px solid var(--edge);
		border-top: none;
		border-radius: 2px 2px 3px 3px;
	}
	.sc-foot {
		margin: 0;
		font-family: var(--font-ui);
		font-size: 12px;
		color: var(--on-lit);
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
	}
	.sc-home {
		color: #ffffff;
		font-weight: bold;
		text-decoration: none;
	}
	.sc-home:hover,
	.sc-home:focus-visible {
		text-decoration: underline;
	}
	.sc-home:focus-visible {
		outline: 2px solid #ffffff;
		outline-offset: 2px;
		border-radius: 3px;
	}
</style>
