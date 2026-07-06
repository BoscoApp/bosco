<!--
	A single desktop window: draggable by its title bar, with top-right − □ × controls, Esc-to-close,
	and click-to-raise. Visibility/position/z-order come from the window manager; the body is passed
	as a snippet. All windows stay mounted (hidden when closed) so their content state persists.
-->
<script lang="ts">
	import type { WinDef } from './windows';
	import type { Windows } from './manager.svelte';

	let { def, wm, children }: { def: WinDef; wm: Windows; children: import('svelte').Snippet } =
		$props();

	const s = $derived(wm.states[def.id]);

	let closeBtn = $state<HTMLButtonElement | null>(null);
	let wasOpen = false;

	const style = $derived.by(() => {
		const parts = [`z-index:${s.z}`];
		if (!s.maxed && s.x !== null) parts.push(`left:${s.x}px`, `top:${s.y}px`, `right:auto`);
		return parts.join(';');
	});

	$effect(() => {
		if (s.open && !wasOpen) queueMicrotask(() => closeBtn?.focus());
		wasOpen = s.open;
	});

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.stopPropagation();
			wm.close(def.id);
		}
	}

	function startDrag(e: PointerEvent) {
		const target = e.target as HTMLElement;
		if (target.closest('.win-controls')) return;
		if (s.maxed || window.matchMedia('(max-width: 560px)').matches) return;

		wm.front(def.id);
		const win = (e.currentTarget as HTMLElement).closest('.window') as HTMLElement;
		const rect = win.getBoundingClientRect();
		const offX = e.clientX - rect.left;
		const offY = e.clientY - rect.top;

		const move = (ev: PointerEvent) => wm.setPos(def.id, ev.clientX - offX, ev.clientY - offY);
		const up = () => {
			document.removeEventListener('pointermove', move);
			document.removeEventListener('pointerup', up);
		};
		document.addEventListener('pointermove', move);
		document.addEventListener('pointerup', up);
		try {
			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		} catch {
			/* pointer capture is best-effort */
		}
		e.preventDefault();
	}
</script>

<div
	class="window"
	class:small={def.small}
	class:maxed={s.maxed}
	class:opening={s.open}
	id={def.id}
	role="dialog"
	aria-labelledby="t-{def.id}"
	aria-hidden={!s.open}
	hidden={!s.open}
	{style}
	onmousedowncapture={() => wm.front(def.id)}
	onkeydown={onKeydown}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="titlebar" onpointerdown={startDrag}>
		<span class="tb-title" id="t-{def.id}">{def.title}</span>
		<span class="tb-fill" aria-hidden="true"></span>
		<span class="win-controls">
			<button
				type="button"
				class="wc wc-min"
				aria-label="Shrink window"
				onclick={() => wm.minimize(def.id)}>&minus;</button
			>
			<button
				type="button"
				class="wc wc-max"
				aria-label="Grow window"
				onclick={() => wm.toggleMax(def.id)}>&#9633;</button
			>
			<button
				type="button"
				class="wc wc-close"
				aria-label="Close window"
				bind:this={closeBtn}
				onclick={() => wm.close(def.id)}>&times;</button
			>
		</span>
	</div>
	<div class="win-body">
		{@render children()}
	</div>
</div>
