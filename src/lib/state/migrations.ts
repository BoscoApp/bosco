import { STATE_VERSION, DEFAULTS, type PersistedData, type PersistedEnvelope } from './schema';

// Ordered migrations keyed by the version they upgrade FROM. Phase 0 has none, but the runner
// exists and is tested so Phase 2 additions (profiles, card album, typing progress) are purely
// additive. Every migration MUST be non-destructive — it may add or reshape keys but must never
// drop a key it doesn't recognise (a kid's card album can outlive any single schema version).
export type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

export const migrations: Record<number, Migration> = {
	// Example of the shape a future migration takes (keep non-destructive):
	// 1: (old) => ({ ...old, profiles: old.profiles ?? [] })
};

/**
 * Upgrade a stored envelope to the current version. Unknown/reserved keys in `data` are
 * preserved (they survive the final DEFAULTS merge because `data` is spread last). Corrupt input
 * is the caller's concern — this function assumes a plausibly-shaped envelope.
 */
export function migrate(envelope: PersistedEnvelope): PersistedEnvelope {
	let version = Number(envelope.version) || 0;
	let data: Record<string, unknown> = { ...(envelope.data ?? {}) };

	while (version < STATE_VERSION) {
		const step = migrations[version];
		if (step) data = step(data);
		version += 1;
	}

	// Fill any missing known fields with defaults while preserving everything already stored,
	// including reserved namespaces we don't yet read.
	return {
		version: STATE_VERSION,
		data: { ...DEFAULTS, ...data } as PersistedData
	};
}
