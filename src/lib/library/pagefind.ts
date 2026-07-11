/**
 * Pagefind glue — a thin, typed, browser-only bridge to the offline search runtime the build emits
 * to `build/pagefind/` (see `scripts/index-search.mjs`). That bundle is NOT part of Vite's module
 * graph, so it's loaded with a runtime dynamic import (`@vite-ignore`); it only exists in a real
 * build, so callers must handle a rejected load (under `vite dev` there is no bundle and search
 * degrades gracefully).
 *
 * Bosco drives this from its own tokenised `SearchPanel` UI rather than Pagefind's default UI (which
 * the index step prunes out of the shipped bundle), so this exposes only the sliver of the API we use.
 */

/** The Pagefind runtime, as loaded from the built bundle. */
export interface PagefindApi {
	/** Warm the engine (loads the entry + wasm) ahead of the first query. */
	init?(): Promise<void>;
	/**
	 * Search after a debounce. Resolves to `null` when a later call superseded this one (so the
	 * caller can drop the stale keystroke), otherwise to the result set.
	 */
	debouncedSearch(
		term: string,
		options?: unknown,
		debounceMs?: number
	): Promise<PagefindSearch | null>;
}

interface PagefindSearch {
	results: PagefindResult[];
}
interface PagefindResult {
	id: string;
	data(): Promise<PagefindDoc>;
}

/** The indexed document Pagefind returns for a matched result. */
export interface PagefindDoc {
	/** Site-root-relative URL of the page, e.g. `/library/creatures/red-fox/`. */
	url: string;
	meta?: { title?: string };
	/** An HTML snippet of the match, with `<mark>` around the matched words. */
	excerpt: string;
}

/** A Library search result, resolved to a base-aware link ready for rendering. */
export interface SearchHit {
	url: string;
	title: string;
	excerpt: string;
}

let cached: Promise<PagefindApi> | null = null;

/**
 * Load (once) the Pagefind runtime from the built bundle. Browser-only. Rejects if the bundle is
 * absent (dev) or fails to load; on rejection the cache is cleared so a later attempt can retry.
 */
export function loadPagefind(base: string): Promise<PagefindApi> {
	if (!cached) {
		const url = `${base}/pagefind/pagefind.js`;
		cached = (import(/* @vite-ignore */ url) as Promise<PagefindApi>).catch((err) => {
			cached = null;
			throw err;
		});
	}
	return cached;
}

/**
 * Map a Pagefind result document to a base-aware Library hit. Pagefind indexes the built site root,
 * so `doc.url` is root-relative; prepending `base` keeps the link correct under a deployment base
 * path and lets the desktop's `/library` in-window intercept match it. (base is '' today, so this is
 * a no-op now but stays correct if that ever changes.)
 */
export function toHit(base: string, doc: PagefindDoc): SearchHit {
	return {
		url: `${base}${doc.url}`,
		title: doc.meta?.title ?? doc.url,
		excerpt: doc.excerpt
	};
}
