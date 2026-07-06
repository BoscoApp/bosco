/**
 * The Portal store — one reactive object shared down the desktop via context. It wraps the
 * v0.1.0 Core primitives (`$lib/state` prefs + profiles, `$lib/calendar` via the liturgy
 * resolver) so components never touch storage or the calendar directly. Preference changes are
 * written straight through to the store; nothing here reaches the network.
 */
import { getContext, setContext } from 'svelte';
import {
	getStore,
	DEFAULT_PREFS,
	type Prefs,
	type Profile,
	type ProfileAvatar,
	type Tier
} from '$lib/state';
import { resolveToday, DEFAULT_TODAY, type Today, type LitKey } from './liturgy';
import { setSoundEnabled, sounds } from './sounds';
import { avatarMarkup, defaultAvatar } from './avatar';
import { Windows } from './manager.svelte';

export const TIER_WORD: Record<Tier, 'seedling' | 'explorer' | 'scholar'> = {
	1: 'seedling',
	2: 'explorer',
	3: 'scholar'
};

export class Portal {
	wm = new Windows();
	today = $state<Today>(DEFAULT_TODAY);
	prefs = $state<Prefs>({ ...DEFAULT_PREFS });
	profiles = $state<Profile[]>([]);
	/** A Settings colour-preview override; the wallpaper shows this instead of today's colour. */
	litPreview = $state<LitKey | null>(null);

	#store = getStore();

	get activeProfile(): Profile | null {
		return this.profiles.find((p) => p.id === this.prefs.activeProfileId) ?? null;
	}
	get litKey(): LitKey {
		return this.litPreview ?? this.today.litKey;
	}
	get tierWord(): 'seedling' | 'explorer' | 'scholar' {
		return TIER_WORD[this.prefs.tier];
	}
	get soundOn(): boolean {
		return !this.prefs.muted;
	}

	/** Inner SVG for a profile's avatar (its chosen one, or a stable default from its id). */
	avatarFor(p: Profile): string {
		return avatarMarkup(p.avatar ?? defaultAvatar(p.id));
	}

	/** Browser-only: load persisted prefs + profiles and resolve today's liturgy. */
	hydrate(): void {
		this.prefs = this.#store.getPrefs();
		this.profiles = this.#store.listProfiles();
		this.today = resolveToday();
		setSoundEnabled(this.soundOn);
	}

	setTier(tier: Tier): void {
		this.prefs.tier = tier;
		this.#store.setPref('tier', tier);
		sounds.tick();
	}
	setMuted(muted: boolean): void {
		this.prefs.muted = muted;
		this.#store.setPref('muted', muted);
		setSoundEnabled(!muted);
		if (!muted) sounds.tick();
	}
	previewLit(key: LitKey | null): void {
		this.litPreview = key;
		sounds.tick();
	}
	pickProfile(id: string): void {
		this.#store.setActiveProfile(id);
		this.prefs = this.#store.getPrefs();
	}
	/** Create a new explorer with a chosen avatar and make them active. */
	startProfile(name: string, avatar: ProfileAvatar): Profile {
		const profile = this.#store.createProfile(name.trim() || 'Explorer', avatar);
		this.profiles = this.#store.listProfiles();
		this.#store.setActiveProfile(profile.id);
		this.prefs = this.#store.getPrefs();
		return profile;
	}
}

const KEY = Symbol('bosco-portal');
export function setPortal(portal: Portal): void {
	setContext(KEY, portal);
}
export function getPortal(): Portal {
	return getContext(KEY) as Portal;
}
