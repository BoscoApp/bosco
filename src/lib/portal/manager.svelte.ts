/**
 * The window manager — reactive state for the desktop's windows. Components read a window's
 * {@link WinState} and bind its position / z-order / visibility; every open/close/minimize/
 * maximize/focus routes through here so the taskbar and the active window stay in sync.
 *
 * DOM concerns (dragging, returning focus) live in the components; this holds only state, plus a
 * non-reactive map of "opener" elements so focus can return where it came from on close.
 */
import { sounds } from './sounds';

export interface WinState {
	id: string;
	/** Visible (rendered, not hidden). */
	open: boolean;
	/** Minimized: hidden but still holding a taskbar tab. */
	min: boolean;
	maxed: boolean;
	/** Free position once dragged/placed; null before first placement (uses CSS defaults). */
	x: number | null;
	y: number | null;
	z: number;
}

const MENUBAR = 28;

export class Windows {
	states = $state<Record<string, WinState>>({});
	tabs = $state<string[]>([]);
	activeId = $state<string | null>(null);

	#z = 100;
	#cascade = 0;
	#openers = new Map<string, HTMLElement | null>();

	state(id: string): WinState {
		if (!this.states[id]) {
			this.states[id] = { id, open: false, min: false, maxed: false, x: null, y: null, z: 100 };
		}
		return this.states[id];
	}

	get anyOpen(): boolean {
		return this.tabs.length > 0;
	}

	#place(w: WinState): void {
		if (w.x !== null) return;
		const n = this.#cascade % 6;
		w.x = 48 + n * 30;
		w.y = 60 + n * 26;
		this.#cascade++;
	}

	front(id: string): void {
		const w = this.state(id);
		w.z = ++this.#z;
		this.activeId = id;
	}

	open(id: string, opener: HTMLElement | null = null): void {
		const w = this.state(id);
		const wasHidden = !w.open;
		this.#openers.set(id, opener);
		this.#place(w);
		w.open = true;
		w.min = false;
		if (!this.tabs.includes(id)) this.tabs = [...this.tabs, id];
		this.front(id);
		if (wasHidden) sounds.open();
	}

	minimize(id: string): void {
		const w = this.state(id);
		w.open = false;
		w.min = true;
		if (this.activeId === id) this.activeId = null;
		sounds.close();
		this.#focusOpener(id);
	}

	close(id: string): void {
		const w = this.state(id);
		w.open = false;
		w.min = false;
		w.maxed = false;
		this.tabs = this.tabs.filter((t) => t !== id);
		if (this.activeId === id) this.activeId = null;
		sounds.close();
		this.#focusOpener(id);
	}

	toggleMax(id: string): void {
		const w = this.state(id);
		w.maxed = !w.maxed;
		sounds.tick();
	}

	/** Taskbar-tab click: restore if hidden, minimize if it's the active window, else raise. */
	onTab(id: string, opener: HTMLElement | null = null): void {
		const w = this.state(id);
		if (!w.open) this.open(id, opener);
		else if (this.activeId === id) this.minimize(id);
		else this.front(id);
	}

	setPos(id: string, clientX: number, clientY: number): void {
		const w = this.state(id);
		w.x = Math.min(Math.max(0, clientX), window.innerWidth - 48);
		w.y = Math.min(Math.max(MENUBAR, clientY), window.innerHeight - 60);
	}

	#focusOpener(id: string): void {
		const el = this.#openers.get(id);
		if (el && document.body.contains(el)) el.focus();
	}
}
