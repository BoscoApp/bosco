import { SCHEMA_VERSION, DEFAULT_PREFS, type PersistedState } from './types';

type Migration = (state: Record<string, unknown>) => Record<string, unknown>;

/**
 * Migrations keyed by the version they upgrade FROM. Add an entry each time SCHEMA_VERSION grows.
 * Migrations must be non-destructive — a child's album/art/progress is never dropped or corrupted.
 */
const MIGRATIONS: Record<number, Migration> = {
	// 0 -> 1: initial shape. Nothing to transform beyond stamping the version + filling defaults.
};

/** Read a possibly-old, possibly-absent persisted blob and return a current, valid state. */
export function migrate(raw: unknown): PersistedState {
	let state: Record<string, unknown> =
		raw && typeof raw === 'object' ? { ...(raw as Record<string, unknown>) } : {};
	let version = typeof state.version === 'number' ? state.version : 0;

	while (version < SCHEMA_VERSION) {
		const step = MIGRATIONS[version];
		if (step) state = step(state);
		version += 1;
	}

	// Fill defaults for any missing/new fields (forward-compatible, non-destructive).
	return {
		version: SCHEMA_VERSION,
		prefs: { ...DEFAULT_PREFS, ...((state.prefs as Partial<PersistedState['prefs']>) ?? {}) },
		profiles: Array.isArray(state.profiles) ? (state.profiles as PersistedState['profiles']) : [],
		syncCursor: typeof state.syncCursor === 'number' ? state.syncCursor : 0
	};
}
