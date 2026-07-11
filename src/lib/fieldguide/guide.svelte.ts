/**
 * In-window Field Guide navigation — a tiny reactive "location" the desktop Field Guide window browses
 * through WITHOUT a SvelteKit navigation (mirrors `LibraryBrowser`). Because the desktop keeps every
 * window mounted, mutating this store instead of calling `goto` leaves window positions, z-order, and
 * other open windows untouched. The prerendered /field-guide routes are the same views for deep links
 * and no-JS.
 *
 * Ships the hub (`index`), an axis page (`axis` — creatures filtered by one habitat/kind), and the
 * in-window creature article (`article`, rendered via the shared ArticleView so any /library topic
 * opens inline). The `album` location arrives with FG-5.
 */
import type { Category } from '$lib/content';

export type GuideLocation =
	| { view: 'index' }
	| { view: 'axis'; axis: 'habitat' | 'kind'; value: string }
	| { view: 'article'; category: Category; slug: string };

export class FieldGuideBrowser {
	location = $state<GuideLocation>({ view: 'index' });
	#history = $state<GuideLocation[]>([]);

	get canBack(): boolean {
		return this.#history.length > 0;
	}

	#go(next: GuideLocation): void {
		this.#history.push(this.location);
		this.location = next;
	}

	index(): void {
		this.#go({ view: 'index' });
	}
	axis(axis: 'habitat' | 'kind', value: string): void {
		this.#go({ view: 'axis', axis, value });
	}
	article(category: Category, slug: string): void {
		this.#go({ view: 'article', category, slug });
	}
	back(): void {
		const prev = this.#history.pop();
		if (prev) this.location = prev;
	}
}
