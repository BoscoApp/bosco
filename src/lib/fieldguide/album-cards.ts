/**
 * Turn a profile's recorded creature slugs into ordered album entries, joining each slug to LIVE
 * gated frontmatter at view time. A slug whose creature is currently gated out (un-approved, or
 * removed) resolves to `topic: undefined` — the view renders that as an inert frame and never leaks
 * a formerly-approved title.
 *
 * Pure and content-agnostic (the resolver is injected), so it is trivially unit-testable and carries
 * no `$lib/content` / `$lib/state` import of its own. Ordering is ALPHABETICAL — deliberately not
 * first-seen, which would render reading chronology as spatial order (a cadence-by-value signal the
 * anti-incentive stance forbids). An unresolved entry sorts by its slug (the only label it has).
 */
export interface AlbumEntry<T> {
	slug: string;
	/** The live gated topic, or `undefined` when the creature is not currently published. */
	topic: T | undefined;
}

export function buildAlbum<T extends { title: string }>(
	slugs: readonly string[],
	resolve: (slug: string) => T | undefined
): AlbumEntry<T>[] {
	return slugs
		.map((slug) => ({ slug, topic: resolve(slug) }))
		.sort((a, b) =>
			(a.topic?.title ?? a.slug).localeCompare(b.topic?.title ?? b.slug, undefined, {
				sensitivity: 'base'
			})
		);
}
