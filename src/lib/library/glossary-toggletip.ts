/**
 * Glossary toggletip controller.
 *
 * The remark plugin bakes every glossary term into the prerendered article as
 * `<button type="button" class="gloss-term" data-gloss-def="…">term</button>`. That HTML is fully
 * readable with no JavaScript (fix c: interactive affordances are gated behind `[data-gloss-ready]`,
 * which this controller sets). When JS runs, `attachGlossary` upgrades those buttons into a
 * *toggletip*: activating one reveals its definition in a small bubble and announces it once via a
 * shared, visually-hidden `role="status"` region; Esc / blur / outside-click dismiss it.
 *
 * A toggletip (not a tooltip): the content appears on explicit activation, not hover, and is conveyed
 * to assistive tech through the live region — the bubble itself is `aria-hidden` so nothing is read
 * twice. One delegated listener set covers every term in the body. Returns a disposer; `ArticleView`
 * calls it on `{#key}` teardown so it dies with the article it belongs to.
 */
export function attachGlossary(body: HTMLElement): () => void {
	const doc = body.ownerDocument;
	const win = doc.defaultView;

	// Shared, initially-EMPTY live region. role=status is a polite live region that only announces on a
	// text CHANGE — so we set it to the definition on open and CLEAR it on close (fix e), which lets the
	// SAME term re-announce the next time it's opened.
	const live = doc.createElement('p');
	live.className = 'visually-hidden';
	live.setAttribute('role', 'status');

	// The visible bubble. aria-hidden: its text reaches assistive tech via the live region, never the
	// bubble, so a screen reader never double-reads the definition.
	const bubble = doc.createElement('div');
	bubble.className = 'gloss-bubble';
	bubble.setAttribute('aria-hidden', 'true');
	bubble.hidden = true;

	body.append(live, bubble);

	let openTrigger: HTMLButtonElement | null = null;

	function close(returnFocus = false): void {
		if (!openTrigger) return;
		const trigger = openTrigger;
		openTrigger = null;
		bubble.hidden = true;
		bubble.classList.remove('is-open');
		live.textContent = ''; // fix (e): re-opening the same term will re-announce
		if (returnFocus) trigger.focus();
	}

	function position(trigger: HTMLButtonElement): void {
		// Anchor the bubble just below the term, clamped INSIDE the article body so it can never overflow
		// the reading column at any tier's --measure-read (fix f). The bubble is a child of the
		// position:relative body, so it scrolls with the prose and stays anchored without a scroll listener.
		bubble.style.left = '0px';
		bubble.style.top = '0px';
		const bodyBox = body.getBoundingClientRect();
		const termBox = trigger.getBoundingClientRect();
		const bubbleWidth = bubble.getBoundingClientRect().width;
		const maxLeft = Math.max(0, body.clientWidth - bubbleWidth);
		const left = Math.min(Math.max(0, termBox.left - bodyBox.left), maxLeft);
		const top = termBox.bottom - bodyBox.top + 6;
		bubble.style.left = `${Math.round(left)}px`;
		bubble.style.top = `${Math.round(top)}px`;
	}

	function open(trigger: HTMLButtonElement): void {
		const def = trigger.dataset.glossDef ?? '';
		if (!def) return;
		if (openTrigger === trigger) {
			close(true); // activating the open term again toggles it off
			return;
		}
		openTrigger = trigger;
		bubble.textContent = def; // textContent, never innerHTML — a definition can never inject markup
		bubble.hidden = false;
		position(trigger);
		bubble.classList.add('is-open');
		live.textContent = def; // announce once
		trigger.focus(); // fix (d): Safari/iOS/Firefox don't focus a <button> on tap; make Esc-return deterministic
	}

	function onClick(e: MouseEvent): void {
		const term = (e.target as HTMLElement | null)?.closest<HTMLButtonElement>('button.gloss-term');
		if (term && body.contains(term)) {
			e.preventDefault();
			open(term);
		} else if (openTrigger && !bubble.contains(e.target as Node)) {
			close(false);
		}
	}

	function onKeydown(e: KeyboardEvent): void {
		if (e.key === 'Escape' && openTrigger) {
			e.stopPropagation();
			close(true);
		}
	}

	function onFocusOut(e: FocusEvent): void {
		// fix (b): close when focus leaves the OPEN TRIGGER specifically — not when focus merely leaves the
		// body. Tabbing from one glossary term to another must not orphan the first term's bubble; the new
		// focus target simply isn't the open trigger, so its own activation manages its own bubble.
		if (!openTrigger || e.target !== openTrigger) return;
		close(false);
	}

	function onPointerDownOutside(e: Event): void {
		if (!openTrigger) return;
		const t = e.target as Node;
		if (openTrigger.contains(t) || bubble.contains(t)) return;
		close(false);
	}

	function onResize(): void {
		close(false);
	}

	function onBubbleMouseDown(e: MouseEvent): void {
		// Pressing inside the (non-focusable) bubble must NOT blur the trigger. In Blink/WebKit a press on
		// non-focusable content moves focus to <body>, which fires focusout on the trigger and — via
		// onFocusOut — would dismiss the very bubble being touched (a child poking the definition). Cancel
		// the mousedown default so focus stays on the trigger and the toggletip stays open, matching
		// onClick's inside-bubble guard. The bubble is presentational (its text is also announced through
		// the live region), so forgoing text-selection inside it is a fair trade for not vanishing.
		e.preventDefault();
	}

	body.addEventListener('click', onClick);
	body.addEventListener('keydown', onKeydown);
	body.addEventListener('focusout', onFocusOut);
	bubble.addEventListener('mousedown', onBubbleMouseDown);
	doc.addEventListener('pointerdown', onPointerDownOutside, true);
	win?.addEventListener('resize', onResize);

	// fix (c): now that the interactive controller is live, let the term buttons look/act interactive.
	body.setAttribute('data-gloss-ready', '');

	return () => {
		body.removeEventListener('click', onClick);
		body.removeEventListener('keydown', onKeydown);
		body.removeEventListener('focusout', onFocusOut);
		bubble.removeEventListener('mousedown', onBubbleMouseDown);
		doc.removeEventListener('pointerdown', onPointerDownOutside, true);
		win?.removeEventListener('resize', onResize);
		body.removeAttribute('data-gloss-ready');
		bubble.remove();
		live.remove();
	};
}
