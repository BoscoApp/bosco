<!--
	The Library, inside the desktop window. It hosts the SAME shared views the prerendered routes use,
	but browses them via the LibraryBrowser store so opening a topic is a pure state change — never a
	navigation that would tear down the desktop. One delegated, base-path-aware click handler turns the
	real /library/** <a href> links inside those views into in-window moves; modified/middle clicks and
	no-JS fall through to the canonical pages. In-window the reading level follows the global Settings
	tier; per-article overrides live on the article itself.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { base } from '$app/paths';
	import { getPortal } from '../portal.svelte';
	import { getTopic, eagerBody, type Category } from '$lib/content';
	import { CATEGORY_LABEL } from '$lib/library/categories';
	import { LibraryBrowser } from '$lib/library/browser.svelte';
	import LibraryHome from '$lib/library/LibraryHome.svelte';
	import CategoryView from '$lib/library/CategoryView.svelte';
	import ArticleView from '$lib/library/ArticleView.svelte';

	const portal = getPortal();
	const browser = new LibraryBrowser();

	let root = $state<HTMLElement | null>(null);
	const loc = $derived(browser.location);
	const topic = $derived(loc.view === 'topic' ? getTopic(loc.category, loc.slug) : undefined);

	const LIB_PREFIX = `${base}/library/`;

	function navigateTo(pathname: string): boolean {
		if (!pathname.startsWith(LIB_PREFIX)) return false;
		const parts = pathname.slice(LIB_PREFIX.length).replace(/\/+$/, '').split('/').filter(Boolean);
		if (parts.length === 0) browser.home();
		else if (parts.length === 1) browser.category(parts[0] as Category);
		else browser.topic(parts[0] as Category, parts[1]);
		focusHeading();
		return true;
	}

	function onClick(e: MouseEvent) {
		if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
			return;
		}
		const a = (e.target as HTMLElement).closest('a');
		if (!a || !a.getAttribute('href')) return;
		const url = new URL(a.href, location.href);
		if (url.origin !== location.origin) return;
		if (navigateTo(url.pathname)) e.preventDefault();
	}

	// After a move, put focus on the new view's heading so keyboard/SR users land in the right place.
	async function focusHeading() {
		await tick();
		root?.querySelector<HTMLElement>('[data-view-heading]')?.focus();
	}

	function goBack() {
		browser.back();
		focusHeading();
	}
</script>

<div class="lib-window" bind:this={root} onclickcapture={onClick}>
	{#if loc.view !== 'home'}
		<nav class="lib-crumbs" aria-label="Library">
			<button type="button" class="lib-back" onclick={goBack} disabled={!browser.canBack}>
				&lsaquo; Back
			</button>
			<a class="crumb" href="{base}/library/">Library</a>
			{#if loc.view === 'category' || loc.view === 'topic'}
				<span class="crumb-sep" aria-hidden="true">/</span>
				<a class="crumb" href="{base}/library/{loc.category}/">{CATEGORY_LABEL[loc.category]}</a>
			{/if}
		</nav>
	{/if}

	<div class="lib-view">
		{#if loc.view === 'home'}
			<LibraryHome level={2} />
		{:else if loc.view === 'category'}
			<CategoryView category={loc.category} level={2} />
		{:else if topic}
			{#key topic.path}
				<ArticleView
					{topic}
					tier={portal.prefs.tier}
					eager={eagerBody(topic.path) ?? null}
					level={2}
				/>
			{/key}
		{:else}
			<p class="lib-missing">That article isn’t in the Library yet.</p>
		{/if}
	</div>
</div>

<style>
	.lib-window {
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-height: 0;
	}
	.lib-crumbs {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		font-family: var(--font-ui);
		font-size: 12.5px;
	}
	.lib-back {
		appearance: none;
		font: inherit;
		font-weight: bold;
		padding: 4px 10px;
		color: var(--ink);
		background: var(--surface-titlebar);
		border: 1px solid var(--edge-strong);
		border-radius: var(--radius-sm);
		cursor: pointer;
	}
	.lib-back:hover:not(:disabled) {
		/* Solid token — color-mix() rejects the --surface-titlebar gradient (would blank to transparent). */
		background: color-mix(in srgb, var(--sel) 14%, var(--plat-hi));
	}
	.lib-back:disabled {
		color: color-mix(in srgb, var(--ink) 34%, var(--paper));
		cursor: not-allowed;
	}
	.lib-back:focus-visible,
	.crumb:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
		border-radius: 3px;
	}
	.crumb {
		color: var(--sel-deep);
		text-decoration: none;
		font-weight: bold;
	}
	.crumb:hover {
		text-decoration: underline;
	}
	.crumb-sep {
		color: var(--ink-soft);
	}
	.lib-missing {
		font-family: var(--font-body);
		color: var(--ink-soft);
	}
</style>
