<!--
	One topic, read at one tier. Host-agnostic: it takes a baseline `tier` (the reader's usual level,
	from Settings in the desktop, or the topic default on a standalone page) and manages a per-article
	OVERRIDE internally, so the same component renders identically inside the desktop window and on the
	prerendered route. The default tier is passed pre-resolved (`eager`) so the standalone page renders
	real prose at prerender; the other two tiers load lazily on the client when the reader switches.
	mdsvex bodies are trusted components (no {@html} of strings). Colours are all tokens.
-->
<script lang="ts">
	import type { Component } from 'svelte';
	import type { Tier, Topic, EagerBody } from '$lib/content';
	import { CATEGORY_LABEL } from './categories';
	import { TIER_WORD, clampToOffered } from './tiers';
	import { attachGlossary } from './glossary-toggletip';
	import TierSwitch from './TierSwitch.svelte';
	import SeeAlso from './SeeAlso.svelte';

	let {
		topic,
		tier,
		eager = null,
		level = 1
	}: {
		topic: Topic;
		/** The reader's baseline level; the shown tier unless they override it here. */
		tier: Tier;
		/**
		 * The default-tier body, resolved at build time. This is the ONLY source for the default
		 * tier (it isn't in `topic.loaders`), so hosts always pass it — from the route for prerender,
		 * and in-window to open without a load flash. The other tiers arrive lazily via the loaders.
		 */
		eager?: EagerBody | null;
		/** Heading level for the title: 1 on a standalone page, 2 inside a desktop window. */
		level?: 1 | 2;
	} = $props();

	// The reader's level, but never one this topic doesn't offer (the global Settings tier is free to
	// be any of 1/2/3; a partial-tier topic would otherwise have no body to show). Falls back to the
	// topic's default, which always has an eager body.
	const baseline = $derived<Tier>(clampToOffered(topic.tiers, tier, topic.defaultTier));
	// Per-article override (null = follow the baseline). Choosing the baseline clears it.
	let override = $state<Tier | null>(null);
	const activeTier = $derived<Tier>(override ?? baseline);

	// Tiers pulled in lazily on the client. The default tier never needs loading — it arrives
	// pre-resolved via `eager`, so the FIRST render (SSR/prerender included) already has prose.
	let loaded = $state<Partial<Record<Tier, Component>>>({});
	const Body = $derived(
		loaded[activeTier] ?? (eager?.tier === activeTier ? eager.component : undefined)
	);

	// Client-only: pull in a tier the reader switched to but we haven't loaded yet.
	$effect(() => {
		const t = activeTier;
		if (loaded[t] || eager?.tier === t || !topic.loaders[t]) return;
		let live = true;
		topic.loaders[t]!().then((m) => {
			if (live) loaded = { ...loaded, [t]: m.default as Component };
		});
		return () => {
			live = false;
		};
	});

	function choose(t: Tier) {
		override = t === baseline ? null : t;
	}

	// Upgrade the prerendered glossary-term buttons into toggletips once mounted. Bound to THIS body
	// element, so Svelte tears the controller down when the {#key topic.path} wrapper recreates the
	// article — the listeners, bubble, and live region never leak across topics. No-JS still renders
	// the terms as plain readable text (the controller sets the [data-gloss-ready] styling marker).
	let bodyEl = $state<HTMLElement | null>(null);
	$effect(() => {
		if (bodyEl) return attachGlossary(bodyEl);
	});
</script>

<article class="article" data-tier={TIER_WORD[activeTier]}>
	<header class="art-head">
		<p class="art-kicker">{CATEGORY_LABEL[topic.category]}</p>
		<svelte:element this={`h${level}`} class="art-title" data-view-heading tabindex="-1">
			{topic.title}
		</svelte:element>
		<p class="art-summary">{topic.summary}</p>
		<TierSwitch
			available={topic.tiers}
			value={activeTier}
			overridden={override !== null}
			onchange={choose}
		/>
	</header>

	<div class="art-body" data-pagefind-body bind:this={bodyEl}>
		{#if Body}
			<Body />
		{:else}
			<p class="art-loading" aria-hidden="true">Turning the page…</p>
		{/if}
	</div>
	<!-- Persistent live region (always in the DOM) so a tier switch's brief load is announced. -->
	<p class="visually-hidden" role="status">{Body ? '' : 'Loading this reading level…'}</p>

	<!-- Connective tissue: curated cross-links. Subsection of the article, so one level down. -->
	<SeeAlso {topic} headingLevel={level + 1} />

	{#if topic.sources.length}
		<footer class="art-sources">
			<span class="src-lead">Where this comes from</span>
			<ul>
				{#each topic.sources as s (s.title)}
					<li>
						{s.title}{#if s.license}<span class="src-lic"> · {s.license}</span>{/if}
					</li>
				{/each}
			</ul>
		</footer>
	{/if}
</article>

<style>
	.article {
		max-width: var(--measure-read);
		margin: 0 auto;
		font-family: var(--font-body);
	}
	.art-head {
		padding-bottom: 14px;
		border-bottom: 1px solid var(--line-soft);
		margin-bottom: 16px;
	}
	.art-kicker {
		margin: 0 0 2px;
		font-family: var(--font-ui);
		font-size: 11.5px;
		font-weight: bold;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink-soft);
	}
	.art-title {
		margin: 0 0 6px;
		font-family: var(--font-display);
		/* Scales with the article's own data-tier via --type-scale. */
		font-size: calc(20px * var(--type-scale, 1));
		line-height: 1.15;
		color: var(--ink);
	}
	.art-title:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 3px;
		border-radius: 3px;
	}
	.art-summary {
		margin: 0 0 14px;
		font-size: 14px;
		color: var(--ink-soft);
	}
	.art-body {
		position: relative; /* the glossary toggletip bubble anchors to this box */
		font-size: calc(var(--fs-read, 16px) * var(--type-scale, 1));
		line-height: var(--lh-body, 1.6);
		color: var(--ink);
	}
	/* Rhythm for the mdsvex-rendered prose (paragraphs, emphasis) without reaching for raw colours. */
	.art-body :global(p) {
		margin: 0 0 0.9em;
	}
	.art-body :global(p:last-child) {
		margin-bottom: 0;
	}
	.art-body :global(em) {
		font-style: italic;
	}
	.art-body :global(strong) {
		font-weight: 700;
	}
	/* In-prose cross-links (bosco:). Solid underline in the selection colour (contrast-verified on
	   --paper) — a deliberate, non-colour-only signal distinct from a future glossary term. */
	.art-body :global(a) {
		color: var(--sel-deep);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.art-body :global(a:hover) {
		text-decoration-thickness: 2px;
	}
	.art-body :global(a:focus-visible) {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
		border-radius: 2px;
	}

	/* Glossary terms. Baked into prerendered HTML as a bare <button>; with NO JavaScript they must read
	   as ordinary prose (fix c) — hence the reset here and the interactive affordance gated behind the
	   controller's [data-gloss-ready] marker below. */
	.art-body :global(.gloss-term) {
		margin: 0;
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		color: inherit;
		text-align: inherit;
		cursor: text;
	}
	/* Fully :global — the `[data-gloss-ready]` marker is added at runtime by the toggletip controller,
	   which Svelte's static "unused selector" analysis can't see; the chain is specific enough (only a
	   ready article body's gloss terms) that it can't leak. */
	:global(.art-body[data-gloss-ready] .gloss-term) {
		cursor: help;
		/* Dotted rule in a gold-brown ink — deliberately distinct from the solid selection-blue underline
		   of a bosco: cross-link, so a definable term never looks like a place to navigate to. */
		text-decoration: underline dotted var(--gloss-rule);
		text-decoration-thickness: 1.5px;
		text-underline-offset: 3px;
	}
	:global(.art-body[data-gloss-ready] .gloss-term:hover) {
		text-decoration-thickness: 2px;
	}
	:global(.art-body[data-gloss-ready] .gloss-term:focus-visible) {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
		border-radius: 2px;
	}

	/* The toggletip bubble the controller positions below an activated term. */
	.art-body :global(.gloss-bubble) {
		position: absolute;
		z-index: 5;
		max-width: min(var(--measure-read), 32ch);
		padding: 8px 11px;
		font-family: var(--font-ui);
		font-size: 13px;
		line-height: 1.4;
		color: var(--ink);
		background: var(--surface-card);
		border: 1px solid var(--gloss-rule);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-pop);
		opacity: 0;
		transform: translateY(-2px);
		transition:
			opacity var(--motion-fast) ease,
			transform var(--motion-fast) ease;
	}
	.art-body :global(.gloss-bubble.is-open) {
		opacity: 1;
		transform: translateY(0);
	}
	/* fix (g): honour reduced-motion — the bubble still appears, just without the slide/fade. */
	@media (prefers-reduced-motion: reduce) {
		.art-body :global(.gloss-bubble) {
			transition: none;
			transform: none;
		}
	}

	.art-loading {
		color: var(--ink-soft);
		font-style: italic;
	}
	.art-sources {
		margin-top: 20px;
		padding-top: 12px;
		border-top: 1px dashed var(--line-soft);
		font-family: var(--font-ui);
		font-size: 12px;
		color: var(--ink-soft);
	}
	.src-lead {
		font-weight: bold;
	}
	.art-sources ul {
		margin: 4px 0 0;
		padding-left: 18px;
	}
	.src-lic {
		opacity: 0.85;
	}
</style>
