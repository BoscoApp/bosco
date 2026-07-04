<script lang="ts">
	import { getTopic, relatedTopics } from '$lib/content';
	import { settings } from '$lib/state/store.svelte';
	import { TIER_TO_NUMBER, resolveTier, TIER_LABEL, parseTierHash } from '$lib/content/tiers';
	import type { ContentTier } from '$lib/content/schema';
	import type { Tier } from '$lib/state/schema';
	import ArtFrame from '$lib/components/ArtFrame.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Re-resolve the topic (with its tier components) from the bundled content module.
	const topic = $derived(getTopic(data.category, data.topic)!);
	const available = $derived(Object.keys(topic.tiers) as ContentTier[]);
	const related = $derived(relatedTopics(topic));

	// A `#tier=` link can force a reading level for THIS view only — it never writes settings, so the
	// reader's saved default stays untouched. Client-only: there is no hash during prerender. And if
	// the reader then uses the global reading-level switch, their explicit choice takes over.
	let hashTier = $state<Tier | null>(null);
	let lastSettingsTier = settings.tier;

	$effect(() => {
		const read = () => (hashTier = parseTierHash(window.location.hash));
		read();
		window.addEventListener('hashchange', read);
		return () => window.removeEventListener('hashchange', read);
	});

	$effect(() => {
		if (settings.tier !== lastSettingsTier) {
			lastSettingsTier = settings.tier;
			hashTier = null;
		}
	});

	// Effective tier: the link override if present, else the global reading level — resolved to the
	// nearest tier this topic authored. Because tiers are eager-imported, switching is instant offline.
	const activeTier = $derived(hashTier ?? settings.tier);
	const effectiveTier = $derived(resolveTier(TIER_TO_NUMBER[activeTier], available));
	const TierComponent = $derived(topic.tiers[effectiveTier]!);
</script>

<svelte:head><title>{topic.frontmatter.title} — Bosco</title></svelte:head>

<article data-pagefind-body data-pagefind-filter="category:{data.category}">
	<p data-pagefind-ignore><a href="/library/">← The Library</a></p>
	<h1>{topic.frontmatter.title}</h1>
	{#if topic.frontmatter.summary}<p class="summary">{topic.frontmatter.summary}</p>{/if}

	{#each topic.frontmatter.media as m (m.alt)}
		<div class="media"><ArtFrame label={m.alt} /></div>
	{/each}

	<p class="tier-indicator" data-pagefind-ignore>
		Reading level: <strong>{TIER_LABEL[activeTier]}</strong>{#if hashTier}
			<span class="via-link">(from this link)</span>{/if}
	</p>

	{#key effectiveTier}
		<TierComponent />
	{/key}

	{#if related.length}
		<section class="see-also" data-pagefind-ignore>
			<h2>See also</h2>
			<ul>
				{#each related as r (r.path)}
					<li>
						<a href="/library/{r.path}/">{r.frontmatter.title}</a>
						{#if r.frontmatter.summary}<span class="note"> — {r.frontmatter.summary}</span>{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if topic.frontmatter.sources.length}
		<section class="meta" data-pagefind-ignore>
			<h2>Sources</h2>
			<ul>
				{#each topic.frontmatter.sources as s (s.title)}
					<li>
						{s.title}{#if s.author}, {s.author}{/if}{#if s.year}
							({s.year}){/if} — {s.license}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if topic.frontmatter.archives.length}
		<section class="meta" data-pagefind-ignore>
			<h2>The Archives</h2>
			<ul>
				{#each topic.frontmatter.archives as a (a.title)}
					<li>
						<strong>{a.title}</strong>{#if a.intro}
							— {a.intro}{/if} <em>({a.license})</em>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</article>

<style>
	.summary {
		font-size: var(--font-size-3);
		color: var(--color-text-muted);
	}

	.media {
		max-width: 20rem;
		margin: var(--space-3) 0;
	}

	.tier-indicator {
		font-size: var(--font-size-1);
		color: var(--color-text-muted);
	}

	.via-link {
		font-style: italic;
	}

	.see-also {
		margin-top: var(--space-5);
	}

	.see-also .note {
		color: var(--color-text-muted);
	}

	.meta {
		margin-top: var(--space-5);
		font-size: var(--font-size-1);
		color: var(--color-text-muted);
	}
</style>
