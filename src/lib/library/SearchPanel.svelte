<!--
	The Library's search box. Offline, client-side search over the prerendered articles, powered by the
	Pagefind bundle the build emits (one record per topic, by construction). Host-agnostic: results are
	real /library/** <a href> links, so the desktop intercepts a plain left-click and opens the topic
	in-window, while on the standalone /library page (and with no JS, where search is simply inert) they
	are ordinary navigations.

	Progressive: the input renders server-side; the Pagefind runtime loads lazily on first focus. If the
	bundle can't load (e.g. `vite dev`, which never builds it), search reports itself unavailable rather
	than breaking the page.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { loadPagefind, toHit, type SearchHit } from './pagefind';

	type Status = 'idle' | 'loading' | 'ready' | 'empty' | 'unavailable';

	let query = $state('');
	let status = $state<Status>('idle');
	let hits = $state<SearchHit[]>([]);

	/** Guards against out-of-order async results: only the latest search may write state. */
	let seq = 0;

	const MAX_RESULTS = 10;

	// Warm the engine on focus so the first keystroke searches instantly. Fire-and-forget; a failed
	// load is handled when a search actually runs.
	async function warm() {
		try {
			const pf = await loadPagefind(base);
			await pf.init?.();
		} catch {
			/* no bundle here — run() will surface it as unavailable */
		}
	}

	async function run() {
		const term = query.trim();
		const mine = ++seq;

		if (term === '') {
			status = 'idle';
			hits = [];
			return;
		}

		status = 'loading'; // keep any prior hits visible while the next query resolves

		try {
			const pf = await loadPagefind(base);
			const search = await pf.debouncedSearch(term, undefined, 200);
			if (search === null) return; // a newer keystroke superseded this call
			if (mine !== seq) return; // a newer search already resolved

			const docs = await Promise.all(search.results.slice(0, MAX_RESULTS).map((r) => r.data()));
			if (mine !== seq) return;

			hits = docs.map((d) => toHit(base, d));
			status = hits.length ? 'ready' : 'empty';
		} catch {
			// The bundle is absent (dev), or the engine/index failed at runtime (blocked wasm, an
			// unreachable fragment). Degrade to a recoverable 'unavailable' — not a stuck 'loading' —
			// so the next keystroke can try again. Guard on `mine === seq` so only the latest search
			// (not a superseded straggler that happened to reject) writes the terminal state.
			if (mine === seq) {
				status = 'unavailable';
				hits = [];
			}
		}
	}

	const term = $derived(query.trim());
	const statusText = $derived(
		status === 'loading'
			? 'Searching…'
			: status === 'ready'
				? `${hits.length} ${hits.length === 1 ? 'result' : 'results'} for “${term}”.`
				: status === 'empty'
					? `No articles matched “${term}”.`
					: status === 'unavailable'
						? 'Search isn’t available here — browse the shelves below.'
						: ''
	);
</script>

<section class="lib-search" role="search">
	<label class="ls-label" for="lib-search-input">Search the Library</label>
	<div class="ls-field">
		<svg
			class="ls-ic"
			viewBox="0 0 16 16"
			aria-hidden="true"
			fill="none"
			stroke="currentColor"
			stroke-width="1.6"
		>
			<circle cx="7" cy="7" r="4.5" />
			<line x1="10.4" y1="10.4" x2="14" y2="14" stroke-linecap="round" />
		</svg>
		<input
			id="lib-search-input"
			class="ls-input"
			type="search"
			autocomplete="off"
			enterkeyhint="search"
			placeholder="Search for a fox, a saint, a place…"
			bind:value={query}
			oninput={run}
			onfocus={warm}
		/>
	</div>

	<p class="ls-status" role="status" aria-live="polite">{statusText}</p>

	{#if hits.length}
		<ul class="ls-results">
			{#each hits as hit (hit.url)}
				<li>
					<a class="ls-hit" href={hit.url}>
						<span class="ls-hit-title">{hit.title}</span>
						<!-- Trusted: the excerpt is first-party, build-time content. Pagefind indexes only the
						     escaped text of our own prerendered articles and injects just <mark> around the
						     matched words — no author or query HTML reaches here. -->
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						<span class="ls-hit-excerpt">{@html hit.excerpt}</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.lib-search {
		margin: 0 0 4px;
	}
	.ls-label {
		display: block;
		margin-bottom: 6px;
		font-family: var(--font-ui);
		font-size: 12px;
		font-weight: bold;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--ink-soft);
	}
	.ls-field {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 10px;
		background: var(--surface-card);
		border: 1px solid var(--edge);
		border-radius: var(--radius-pill);
	}
	.ls-field:focus-within {
		border-color: var(--sel);
		outline: 2px solid var(--focus);
		outline-offset: 1px;
	}
	.ls-ic {
		flex: none;
		width: 15px;
		height: 15px;
		color: var(--ink-soft);
	}
	.ls-input {
		flex: 1;
		min-width: 0;
		padding: 9px 0;
		font-family: var(--font-body);
		font-size: 14px;
		color: var(--ink);
		background: transparent;
		border: 0;
		outline: none;
	}
	.ls-input::placeholder {
		/* On the white field (--surface-card) this clears WCAG AA 4.5:1 (~5.2:1); axe doesn't check
		   ::placeholder, so the ratio is held here deliberately. */
		color: color-mix(in srgb, var(--ink) 62%, var(--paper));
	}
	.ls-status {
		margin: 8px 2px 0;
		min-height: 1em;
		font-family: var(--font-ui);
		font-size: 12px;
		color: var(--ink-soft);
	}
	.ls-results {
		list-style: none;
		margin: 8px 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.ls-hit {
		display: flex;
		flex-direction: column;
		gap: 3px;
		padding: 10px 12px;
		text-decoration: none;
		background: var(--surface-card);
		border: 1px solid var(--line-card);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-raised);
	}
	.ls-hit:hover {
		border-color: var(--edge-strong);
	}
	.ls-hit:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
	}
	.ls-hit-title {
		font-family: var(--font-ui);
		font-weight: bold;
		font-size: 14px;
		color: var(--sel-deep);
	}
	.ls-hit-excerpt {
		font-family: var(--font-body);
		font-size: 12.5px;
		line-height: 1.45;
		color: var(--ink-soft);
	}
	.ls-hit-excerpt :global(mark) {
		padding: 0 1px;
		color: var(--ink);
		background: var(--tint-gold);
		border-radius: 2px;
	}
</style>
