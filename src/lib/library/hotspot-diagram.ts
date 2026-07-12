/**
 * Hotspot-diagram enhancer.
 *
 * HotspotDiagram bakes the whole diagram as readable DOM: a `<dl>` of {label, blurb} that a no-JS or
 * print reader gets in full, and `<button>` pins whose accessible NAME (`aria-label`) and DESCRIPTION
 * (`aria-describedby` → the baked blurb) are already complete without any script. This controller is
 * PURE ENHANCEMENT (the `data-gloss` bake-accessible-DOM-then-enhance precedent): when JS runs it
 * cross-highlights a pin and its matching list row on hover or focus — the abstract point on the plate
 * and the named fact below light up together. It creates and hides NOTHING; a screen reader already has
 * everything through the baked DOM, so nothing is announced twice and no ARIA is toggled here.
 *
 * One delegated listener set (hover + focus, both directions) covers every pin and row. Returns a
 * disposer; HotspotDiagram calls it on teardown (Svelte reruns the `$effect` cleanup when the
 * `{#key topic.path}` article wrapper recreates the view), so it dies with the diagram it belongs to
 * and never leaks listeners or a stuck highlight across topics.
 */
export function attachHotspots(root: HTMLElement): () => void {
	// id → the two elements that share it (one pin, one list row), read once from the baked DOM.
	const pins = new Map<string, HTMLElement>();
	const rows = new Map<string, HTMLElement>();
	for (const el of root.querySelectorAll<HTMLElement>('[data-hotspot]')) {
		if (el.dataset.hotspot) pins.set(el.dataset.hotspot, el);
	}
	for (const el of root.querySelectorAll<HTMLElement>('[data-hotspot-row]')) {
		if (el.dataset.hotspotRow) rows.set(el.dataset.hotspotRow, el);
	}

	let activeId: string | null = null;
	function setActive(id: string | null): void {
		if (id === activeId) return;
		if (activeId) {
			pins.get(activeId)?.classList.remove('is-active');
			rows.get(activeId)?.classList.remove('is-active');
		}
		activeId = id;
		if (id) {
			pins.get(id)?.classList.add('is-active');
			rows.get(id)?.classList.add('is-active');
		}
	}

	// The hotspot id under an event target, from either a pin or a row (or null if outside any hotspot).
	function idFrom(target: EventTarget | null): string | null {
		const el = (target as HTMLElement | null)?.closest<HTMLElement>(
			'[data-hotspot], [data-hotspot-row]'
		);
		return el ? (el.dataset.hotspot ?? el.dataset.hotspotRow ?? null) : null;
	}

	function onOver(e: Event): void {
		setActive(idFrom(e.target));
	}
	function onOut(e: Event): void {
		// pointerout also fires moving onto a child; only clear when leaving to something outside a hotspot.
		if (idFrom((e as PointerEvent).relatedTarget) === null) setActive(null);
	}
	function onFocusIn(e: Event): void {
		const id = idFrom(e.target);
		if (id) setActive(id);
	}
	function onFocusOut(e: Event): void {
		// Only a pin is focusable; clear when focus leaves it (unless it moves straight to another hotspot).
		if (idFrom((e as FocusEvent).relatedTarget) === null) setActive(null);
	}

	root.addEventListener('pointerover', onOver);
	root.addEventListener('pointerout', onOut);
	root.addEventListener('focusin', onFocusIn);
	root.addEventListener('focusout', onFocusOut);
	// A runtime "controller is live" signal (the e2e asserts it). Unlike the glossary's
	// `[data-gloss-ready]` — which gates a term's whole interactive look, because a no-JS term must read
	// as plain prose — nothing here CSS-gates on this marker: the pins are real focusable buttons whose
	// aria-describedby already works with no JS, and the only JS-exclusive affordance (the cross-highlight)
	// is gated by the `.is-active` class this controller adds, never by a no-JS reader's CSS.
	root.setAttribute('data-hotspots-ready', '');

	return () => {
		root.removeEventListener('pointerover', onOver);
		root.removeEventListener('pointerout', onOut);
		root.removeEventListener('focusin', onFocusIn);
		root.removeEventListener('focusout', onFocusOut);
		root.removeAttribute('data-hotspots-ready');
		setActive(null);
	};
}
