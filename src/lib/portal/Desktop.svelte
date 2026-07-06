<!--
	The Bosco desktop — the whole Portal shell. Owns the menu bar, the app-icon dock, the bottom
	taskbar, and every window. It wires the shared Portal store (prefs/profiles/calendar) to the
	three theme axes on <html>, and opens the "Who's exploring?" window on first run.
-->
<script lang="ts">
	import { onMount, type Component } from 'svelte';
	import './desktop.css';
	import IconSprite from './IconSprite.svelte';
	import Icon from './Icon.svelte';
	import Avatar from './Avatar.svelte';
	import Window from './Window.svelte';
	import { Portal, setPortal } from './portal.svelte';
	import { WINDOWS, WINDOW_BY_ID, DOCK, ROOMS } from './windows';
	import HomeBody from './windows/HomeBody.svelte';
	import SettingsBody from './windows/SettingsBody.svelte';
	import HelpBody from './windows/HelpBody.svelte';
	import AboutBody from './windows/AboutBody.svelte';
	import WhoBody from './windows/WhoBody.svelte';
	import RoomBody from './windows/RoomBody.svelte';

	const portal = new Portal();
	setPortal(portal);
	WINDOWS.forEach((w) => portal.wm.state(w.id));

	const BODY: Record<string, Component> = {
		'win-home': HomeBody,
		'win-settings': SettingsBody,
		'win-help': HelpBody,
		'win-about': AboutBody,
		'win-who': WhoBody
	};

	function open(id: string, e: MouseEvent) {
		portal.wm.open(id, e.currentTarget as HTMLElement);
	}

	// Keep the three theme axes on <html> in sync with the store (client-only effect).
	$effect(() => {
		const el = document.documentElement;
		el.setAttribute('data-theme', portal.prefs.theme);
		el.setAttribute('data-lit', portal.litKey);
		el.setAttribute('data-tier', portal.tierWord);
	});

	onMount(() => {
		portal.hydrate();
		if (!portal.activeProfile) portal.wm.open('win-who');
	});
</script>

<IconSprite />

<div class="desktop">
	<div class="menubar">
		<button
			type="button"
			class="mb-item home"
			aria-label="Home — open the welcome window"
			onclick={(e) => open('win-home', e)}
		>
			<svg width="16" height="15" viewBox="0 0 16 15" aria-hidden="true"
				><path
					d="M8 1.5 L15 7.5 H13 V13.5 H9.5 V9.5 H6.5 V13.5 H3 V7.5 H1 Z"
					fill="#42484f"
					stroke="#42484f"
					stroke-width="0.6"
					stroke-linejoin="round"
				/></svg
			><b>Home</b>
		</button>
		<button type="button" class="mb-item" onclick={(e) => open('win-chapel', e)}>Chapel</button>
		<button type="button" class="mb-item" onclick={(e) => open('win-library', e)}>Library</button>
		<button type="button" class="mb-item" onclick={(e) => open('win-settings', e)}>Settings</button>
		<button type="button" class="mb-item" onclick={(e) => open('win-help', e)}>Help</button>
		<div class="mb-right">
			{#if portal.activeProfile}
				<button
					type="button"
					class="mb-profile"
					aria-label="Switch explorer"
					onclick={(e) => open('win-who', e)}
				>
					<Avatar markup={portal.avatarFor(portal.activeProfile)} />
					<span class="chip-name">{portal.activeProfile.name}</span>
				</button>
			{/if}
			<div class="clock" aria-label="Today's liturgical season">
				<span class="dot" aria-hidden="true"></span><span>{portal.today.season}</span>
			</div>
		</div>
	</div>

	<div class="dock" role="group" aria-label="Bosco — the six places">
		{#each DOCK as app (app.id)}
			<button type="button" class="d-ico" onclick={(e) => open(app.id, e)}>
				<Icon id={app.icon} />
				<span class="lbl">{app.label}</span>
			</button>
		{/each}
	</div>

	<p class="desk-hint">
		This is your Bosco desktop. Click a picture to open it; open windows collect in the bar at the
		bottom. Windows have <b>&minus; &#9633; &times;</b> top-right — shrink, grow, close.
	</p>

	{#each WINDOWS as def (def.id)}
		<Window {def} wm={portal.wm}>
			{#if ROOMS[def.id]}
				<RoomBody room={ROOMS[def.id]} />
			{:else}
				{@const Body = BODY[def.id]}
				<Body />
			{/if}
		</Window>
	{/each}

	{#if portal.wm.anyOpen}
		<div class="taskbar" role="group" aria-label="Open windows">
			<span class="tb-lead">Open:</span>
			{#each portal.wm.tabs as id (id)}
				{@const def = WINDOW_BY_ID[id]}
				{@const st = portal.wm.states[id]}
				<button
					type="button"
					class="task"
					class:active={st.open && portal.wm.activeId === id}
					class:mini={!st.open}
					onclick={(e) => portal.wm.onTab(id, e.currentTarget)}
				>
					<svg class="tico" viewBox="0 0 52 52" aria-hidden="true"><use href="#{def.icon}" /></svg>
					<span>{def.title}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>
