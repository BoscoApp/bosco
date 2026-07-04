import { STATE_KEY, STATE_VERSION, DEFAULTS, type PersistedData } from './schema';
import { migrate } from './migrations';

// Resolved at call time (not import time) so the logic is exercisable under a mocked global in
// the node test project, and is a safe no-op during SSR/prerender where localStorage is absent.
function getStorage(): Storage | null {
	return typeof localStorage !== 'undefined' ? localStorage : null;
}

/**
 * Load persisted state. Never throws: any absence, quota error, or corrupt/invalid value falls
 * back to DEFAULTS rather than wiping the device or crashing the app.
 */
export function load(): PersistedData {
	const storage = getStorage();
	if (!storage) return { ...DEFAULTS };
	try {
		const raw = storage.getItem(STATE_KEY);
		if (!raw) return { ...DEFAULTS };
		const parsed = JSON.parse(raw) as unknown;
		if (!parsed || typeof parsed !== 'object' || !('data' in parsed)) {
			return { ...DEFAULTS };
		}
		const envelope = parsed as { version?: unknown; data?: unknown };
		if (!envelope.data || typeof envelope.data !== 'object') return { ...DEFAULTS };
		return migrate({
			version: Number(envelope.version) || 0,
			data: envelope.data as PersistedData
		}).data;
	} catch {
		return { ...DEFAULTS };
	}
}

/** Persist state under the single root key. No-ops off-device and swallows quota/private-mode errors. */
export function persist(data: PersistedData): void {
	const storage = getStorage();
	if (!storage) return;
	try {
		storage.setItem(STATE_KEY, JSON.stringify({ version: STATE_VERSION, data }));
	} catch {
		/* quota exceeded / private mode — ignore */
	}
}
