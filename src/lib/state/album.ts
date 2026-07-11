/**
 * The card album — a quiet, per-child RECORD of the creatures a reader has met in the Library.
 *
 * Records, NOT rewards. A creature is recorded the first time its article is opened; re-reading does
 * nothing. There is deliberately no rarity, no streak, no count, no "earned at" — the anti-incentive
 * stance is enforced by the ABSENCE of those fields, not by hiding them. The vocabulary here is
 * neutral on purpose (`recordCard`, not `earn`/`claim`) so reward language can't leak into the UI.
 *
 * This is a thin wrapper over the store's generic {@link BoscoStore.recordOnce} primitive: it pins the
 * album's collection name + record shape, and makes every call safe when there is no active profile
 * (a visitor who hasn't made one can still browse and read — recording is simply skipped).
 */
import type { BoscoStore } from './store';
import type { SyncRecord } from './types';

/** The album's collection name; the store scopes it to the active profile (`${profileId}:album`). */
export const ALBUM_COLLECTION = 'album';

/**
 * What a card stores: nothing but a schema-version tag. Title, art, and summary are joined from LIVE
 * gated frontmatter at view time, so a creature that is later un-approved resolves to an inert frame
 * and never leaks a formerly-approved title. Carries no rarity / streak / count / timestamp of its own.
 */
export interface CardData {
	v: 1;
}

/** A recorded card. Its `id` is the creature slug (natural dedupe + lossless sync union-merge). */
export type Card = SyncRecord<CardData>;

/**
 * Record that a creature has been read. Idempotent (recording the same slug twice is a no-op with no
 * re-timestamp) and monotonic (never removed). A no-op when there is no active profile.
 */
export async function recordCard(store: BoscoStore, slug: string): Promise<void> {
	if (!store.activeProfile) return;
	await store.recordOnce<CardData>(ALBUM_COLLECTION, slug, { v: 1 });
}

/** Whether the active profile's album already holds `slug`. `false` when there is no active profile. */
export async function hasCard(store: BoscoStore, slug: string): Promise<boolean> {
	if (!store.activeProfile) return false;
	const cards = await store.getRecords<CardData>(ALBUM_COLLECTION);
	return cards.some((c) => c.id === slug && !c.deleted);
}

/**
 * The active profile's recorded creature slugs (tombstones filtered out). Empty when there is no
 * active profile — which is exactly what the album view renders as its "make a profile" state.
 */
export async function listCards(store: BoscoStore): Promise<string[]> {
	if (!store.activeProfile) return [];
	const cards = await store.getRecords<CardData>(ALBUM_COLLECTION);
	return cards.filter((c) => !c.deleted).map((c) => c.id);
}
