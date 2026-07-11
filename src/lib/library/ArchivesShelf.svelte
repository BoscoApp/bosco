<!--
	"The Archives" — a per-topic shelf of the verbatim public-domain source writings behind an article,
	for older readers who want to go straight to the originals. A sibling of SeeAlso: it renders at the
	foot of an article (broaden → deepen → cite: See also, then The Archives, then the sources).

	Shown only on topics that OFFER the Scholar tier (topic.tiers includes 3) — a static, prerender-safe
	proxy for "deep enough to have grown-up sources", so the shelf appears in the no-JS static HTML and
	never depends on the reader's live reading level. No topic ships archives yet, so the visible state
	today is the empty teaser; when an archive document + its viewer arrive (a later PR), each entry
	becomes a link to `${base}/library/${category}/${slug}/archives/<file>/` with NO change to this data.
	Entries are INERT until then — a link with no route would 404 and break the offline invariant.
-->
<script lang="ts">
	import type { Topic } from '$lib/content';

	let {
		topic,
		headingLevel = 2
	}: {
		topic: Topic;
		/** The article title is h{level}; the Archives is a subsection, so hosts pass level + 1. */
		headingLevel?: number;
	} = $props();

	// One-line escape hatch: flip to false for hidden-until-non-empty if the standing teaser reads as
	// repetitive once several Scholar topics ship without archives.
	const SHOW_EMPTY_TEASER = true;

	const offersScholar = $derived(topic.tiers.includes(3));
	const archives = $derived(topic.archives);
	const show = $derived(offersScholar && (archives.length > 0 || SHOW_EMPTY_TEASER));
</script>

{#if show}
	<section class="archives" aria-labelledby="archives-heading-{topic.slug}">
		<p class="ar-kicker">For older readers</p>
		<svelte:element this={`h${headingLevel}`} id="archives-heading-{topic.slug}" class="ar-title">
			The Archives
		</svelte:element>

		{#if archives.length}
			<ul class="ar-list">
				{#each archives as a (a.file)}
					<li class="ar-item">
						<span class="ar-item-title">{a.title}</span>
						{#if a.source || a.license}
							<!-- Build the "source · license" line in JS: template whitespace around an inline
							     separator element gets trimmed, gluing the middot to both words. -->
							<span class="ar-meta">{[a.source, a.license].filter(Boolean).join(' · ')}</span>
						{/if}
						<span class="ar-tag">In the reading room soon</span>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="ar-teaser">
				The Archives keep the original writings behind this article — the real words, kept whole —
				for readers ready to go straight to the source. We’re still stocking these shelves.
			</p>
		{/if}
	</section>
{/if}

<style>
	.archives {
		margin-top: 22px;
		padding: 13px 16px 15px;
		background: var(--surface-bulletin);
		border: 1px solid var(--parchment-line);
		border-radius: var(--radius-sm);
	}
	.ar-kicker {
		margin: 0 0 1px;
		font-family: var(--font-ui);
		font-size: 11px;
		font-weight: bold;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--parchment-ink) 78%, var(--parchment));
	}
	.ar-title {
		margin: 0 0 8px;
		font-family: var(--font-serif);
		font-size: 17px;
		line-height: 1.15;
		color: var(--parchment-ink);
	}
	.ar-teaser {
		margin: 0;
		font-family: var(--font-body);
		font-size: 13px;
		line-height: 1.5;
		color: color-mix(in srgb, var(--parchment-ink) 90%, var(--parchment));
	}
	.ar-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.ar-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 8px 10px;
		background: color-mix(in srgb, var(--parchment) 55%, var(--surface-card));
		border: 1px solid var(--line-gold);
		border-radius: var(--radius-sm);
	}
	.ar-item-title {
		font-family: var(--font-serif);
		font-size: 14px;
		color: var(--parchment-ink);
	}
	.ar-meta {
		font-family: var(--font-ui);
		font-size: 11.5px;
		/* 80% ink clears WCAG AA (>= 4.5:1) for this small attribution text on the card background. */
		color: color-mix(in srgb, var(--parchment-ink) 80%, var(--parchment));
	}
	.ar-tag {
		align-self: flex-start;
		margin-top: 3px;
		padding: 1px 7px;
		font-family: var(--font-ui);
		font-size: 10.5px;
		font-weight: bold;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		color: var(--ink-gold);
		background: var(--tint-gold);
		border: 1px solid var(--line-gold);
		border-radius: var(--radius-pill);
	}
</style>
