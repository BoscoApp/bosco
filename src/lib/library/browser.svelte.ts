/**
 * In-window Library navigation — a tiny reactive "location" the desktop Library window browses
 * through WITHOUT a SvelteKit navigation. Because the desktop keeps every window mounted, mutating
 * this store (instead of calling `goto`) leaves window positions, z-order, and other open windows
 * untouched. The prerendered /library routes are the same views for deep links and no-JS.
 */
import type { Category } from '$lib/content';

export type LibraryLocation =
	| { view: 'home' }
	| { view: 'category'; category: Category }
	| { view: 'topic'; category: Category; slug: string };

export class LibraryBrowser {
	location = $state<LibraryLocation>({ view: 'home' });
	#history = $state<LibraryLocation[]>([]);

	get canBack(): boolean {
		return this.#history.length > 0;
	}

	#go(next: LibraryLocation): void {
		this.#history.push(this.location);
		this.location = next;
	}

	home(): void {
		this.#go({ view: 'home' });
	}
	category(category: Category): void {
		this.#go({ view: 'category', category });
	}
	topic(category: Category, slug: string): void {
		this.#go({ view: 'topic', category, slug });
	}
	back(): void {
		const prev = this.#history.pop();
		if (prev) this.location = prev;
	}
}
