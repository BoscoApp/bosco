/**
 * The Field Guide's two browse axes — habitat and kind — as reader-facing labels + grouping helpers.
 * Parallel to `src/lib/library/categories.ts`. The creature set itself is the gated
 * `topicsByCategory('creatures')`; these functions only sort it two ways.
 */
import { HABITATS, KINDS, type Habitat, type CreatureKind } from '$lib/content';

/** Where a creature lives — the display label for each habitat value (kid-facing). */
export const HABITAT_LABEL: Record<Habitat, string> = {
	woodland: 'Woodland',
	grassland: 'Grassland',
	wetland: 'Wetland',
	ocean: 'Ocean',
	river: 'River',
	desert: 'Desert',
	mountain: 'Mountain',
	polar: 'Polar',
	sky: 'Sky',
	farmland: 'Farmland',
	garden: 'Garden'
};

/** What a creature is — the (plural) display label for each kind value. */
export const KIND_LABEL: Record<CreatureKind, string> = {
	mammal: 'Mammals',
	bird: 'Birds',
	fish: 'Fish',
	reptile: 'Reptiles',
	amphibian: 'Amphibians',
	insect: 'Insects',
	arachnid: 'Arachnids',
	mollusk: 'Mollusks',
	bestiary: 'Bestiary'
};

/** Stable display order for each axis = the schema's enum declaration order. */
export const HABITAT_ORDER = HABITATS;
export const KIND_ORDER = KINDS;

/** Just enough of a creature topic to sort it — so the helpers are trivially unit-testable. */
interface CreatureLike {
	habitat?: readonly Habitat[];
	kind?: CreatureKind;
}

/** A non-empty axis bucket: an axis value, its label, and the creatures in it (input order preserved). */
export interface AxisGroup<V, T> {
	value: V;
	label: string;
	topics: T[];
}

/**
 * Group creatures by habitat, in enum order, dropping empty buckets. A creature with several habitats
 * appears in each — the Field Guide is a browse index, not a partition.
 */
export function groupByHabitat<T extends CreatureLike>(
	creatures: readonly T[]
): AxisGroup<Habitat, T>[] {
	return HABITAT_ORDER.map((value) => ({
		value,
		label: HABITAT_LABEL[value],
		topics: creatures.filter((t) => (t.habitat ?? []).includes(value))
	})).filter((g) => g.topics.length > 0);
}

/** Group creatures by kind, in enum order, dropping empty buckets (each creature has exactly one kind). */
export function groupByKind<T extends CreatureLike>(
	creatures: readonly T[]
): AxisGroup<CreatureKind, T>[] {
	return KIND_ORDER.map((value) => ({
		value,
		label: KIND_LABEL[value],
		topics: creatures.filter((t) => t.kind === value)
	})).filter((g) => g.topics.length > 0);
}

/**
 * The habitat values actually PRESENT in a creature set, in enum order. Drives the axis routes'
 * `entries()` (so only non-empty pages prerender) and their `load()` 404 (an absent/typo value fails).
 */
export function presentHabitats<T extends CreatureLike>(creatures: readonly T[]): Habitat[] {
	return groupByHabitat(creatures).map((g) => g.value);
}

/** The kind values actually present in a creature set, in enum order. */
export function presentKinds<T extends CreatureLike>(creatures: readonly T[]): CreatureKind[] {
	return groupByKind(creatures).map((g) => g.value);
}
