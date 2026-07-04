import { DEFAULTS, type PersistedData, type Tier, type Theme } from './schema';
import { load, persist } from './persistence';

// The single reactive settings store. This module and persistence.ts are the ONLY code permitted
// to touch localStorage (brief §5 hard rule 3 / non-goal 1). Every component reads `settings`.
class SettingsStore {
	#data = $state<PersistedData>({ ...DEFAULTS });

	constructor() {
		this.#data = load();
	}

	get tier(): Tier {
		return this.#data.tier;
	}
	set tier(value: Tier) {
		this.#data.tier = value;
		this.#save();
	}

	get theme(): Theme {
		return this.#data.theme;
	}
	set theme(value: Theme) {
		this.#data.theme = value;
		this.#save();
	}

	get muted(): boolean {
		return this.#data.muted;
	}
	set muted(value: boolean) {
		this.#data.muted = value;
		this.#save();
	}

	get patronSaint(): string | null {
		return this.#data.patronSaint;
	}
	set patronSaint(value: string | null) {
		this.#data.patronSaint = value;
		this.#save();
	}

	toggleMute(): void {
		this.muted = !this.muted;
	}

	#save(): void {
		persist(this.#data);
	}
}

export const settings = new SettingsStore();
