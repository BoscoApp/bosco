// Versioned localStorage schema. This is the ONLY shape persisted to the device (brief §5:
// "localStorage wrapped in one small module ... versioned schema so migrations don't nuke a
// kid's card album"). Phase 0 persists tier/theme/muted/patronSaint; the reserved namespaces
// below are documented but NOT populated until Phase 2.

export const STATE_KEY = 'bosco.state';
export const STATE_VERSION = 1;

export type Tier = 'seedling' | 'explorer' | 'scholar';
export type Theme = 'clubhouse' | 'meadow';

export interface PersistedData {
	tier: Tier;
	theme: Theme;
	muted: boolean;
	/** Once-set patron saint (flags the child's own name day on the Portal). */
	patronSaint: string | null;

	// --- Reserved for Phase 2 (do not populate yet). Migrations must never drop these. ---
	// profiles?: Profile[];
	// typingProgress?: TypingProgress;
	// cardAlbum?: CardAlbum;
}

export interface PersistedEnvelope {
	version: number;
	data: PersistedData;
}

export const DEFAULTS: PersistedData = {
	tier: 'explorer',
	theme: 'clubhouse',
	muted: false,
	patronSaint: null
};
