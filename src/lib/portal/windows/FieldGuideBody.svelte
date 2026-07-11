<!--
	The Field Guide, inside the desktop window. It hosts the same shared views the prerendered routes
	use, browsing them via a FieldGuideBrowser store so opening a creature is a pure state change — never
	a navigation that would tear down the desktop. The shared anchor-intercept claims BOTH /field-guide/
	(the hub) and the FULL /library/ prefix, so a creature's article — and every cross-link inside it, to
	any category — opens in-window via the shared ArticleView; modified/middle clicks and no-JS fall
	through to the canonical pages.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { base } from '$app/paths';
	import { getPortal } from '../portal.svelte';
	import { getTopic, eagerBody, type Category } from '$lib/content';
	import { anchorIntercept } from '../anchorIntercept';
	import { FieldGuideBrowser } from '$lib/fieldguide/guide.svelte';
	import FieldGuideHome from '$lib/fieldguide/FieldGuideHome.svelte';
	import ArticleView from '$lib/library/ArticleView.svelte';

	const portal = getPortal();
	const browser = new FieldGuideBrowser();

	let root = $state<HTMLElement | null>(null);
	const loc = $derived(browser.location);
	const topic = $derived(loc.view === 'article' ? getTopic(loc.category, loc.slug) : undefined);

	const FG_PREFIX = `${base}/field-guide/`;
	const LIB_PREFIX = `${base}/library/`;

	function navigateTo(pathname: string): boolean {
		if (pathname.startsWith(FG_PREFIX)) {
			const rest = pathname.slice(FG_PREFIX.length).replace(/\/+$/, '').split('/').filter(Boolean);
			if (rest.length === 0) {
				browser.index();
				focusHeading();
				return true;
			}
			// Axis routes (/field-guide/habitat|kind/…) arrive in FG-3b; until then, real navigation.
			return false;
		}
		if (pathname.startsWith(LIB_PREFIX)) {
			const parts = pathname
				.slice(LIB_PREFIX.length)
				.replace(/\/+$/, '')
				.split('/')
				.filter(Boolean);
			// A topic link (any category) opens inline; the Library home/shelf are another window's job.
			if (parts.length === 2) {
				browser.article(parts[0] as Category, parts[1]);
				focusHeading();
				return true;
			}
			return false;
		}
		return false;
	}

	const onClick = anchorIntercept(navigateTo);

	// After every move — including Back — put focus on the new view's heading.
	async function focusHeading() {
		await tick();
		root?.querySelector<HTMLElement>('[data-view-heading]')?.focus();
	}

	function goBack() {
		browser.back();
		focusHeading();
	}
</script>

<div class="fg-window" bind:this={root} onclickcapture={onClick}>
	{#if loc.view !== 'index'}
		<nav class="fg-crumbs" aria-label="Field Guide">
			<button type="button" class="fg-back" onclick={goBack} disabled={!browser.canBack}>
				&lsaquo; Back
			</button>
			<a class="crumb" href="{base}/field-guide/">Field Guide</a>
		</nav>
	{/if}

	<div class="fg-view">
		{#if loc.view === 'index'}
			<FieldGuideHome level={2} />
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
			<!-- Unreachable in the gated app (every link resolves); still a focus target for defence. -->
			<p class="fg-missing" data-view-heading tabindex="-1">
				That article isn’t in the Library yet.
			</p>
		{/if}
	</div>
</div>

<style>
	.fg-window {
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-height: 0;
	}
	.fg-crumbs {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		font-family: var(--font-ui);
		font-size: 12.5px;
	}
	.fg-back {
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
	.fg-back:hover:not(:disabled) {
		/* Solid token — color-mix() rejects the --surface-titlebar gradient (would blank to transparent). */
		background: color-mix(in srgb, var(--sel) 14%, var(--plat-hi));
	}
	.fg-back:disabled {
		color: color-mix(in srgb, var(--ink) 34%, var(--paper));
		cursor: not-allowed;
	}
	.fg-back:focus-visible,
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
	.fg-missing {
		font-family: var(--font-body);
		color: var(--ink-soft);
	}
</style>
