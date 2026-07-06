<!-- "Who's exploring?" — pick an existing explorer, or make a new one with the avatar generator.
     Profiles + avatars persist through $lib/state (issue #70). Nothing leaves this device. -->
<script lang="ts">
	import Icon from '../Icon.svelte';
	import Avatar from '../Avatar.svelte';
	import { getPortal } from '../portal.svelte';
	import { avatarMarkup, randomAvatar } from '../avatar';
	import { sounds } from '../sounds';
	import type { ProfileAvatar } from '$lib/state';

	const portal = getPortal();

	let av = $state<ProfileAvatar>({ color: 0, emblem: 0 });
	let name = $state('');
	const previewMarkup = $derived(avatarMarkup(av));

	function shuffle() {
		av = randomAvatar();
		sounds.tick();
	}
	function pick(id: string) {
		portal.pickProfile(id);
		portal.wm.close('win-who');
		portal.wm.open('win-home');
	}
	function start() {
		portal.startProfile(name, av);
		name = '';
		portal.wm.close('win-who');
		portal.wm.open('win-home');
	}
</script>

<div class="room-hero">
	<Icon id="ic-who" />
	<div>
		<h2>Who&rsquo;s exploring today?</h2>
		<p>Pick yourself, or make a new explorer. It all stays on this computer.</p>
	</div>
</div>
<div class="who-body">
	{#if portal.profiles.length > 0}
		<p class="who-sub">Explorers on this computer</p>
		<div class="who-presets">
			{#each portal.profiles as p (p.id)}
				<button type="button" class="who-card" onclick={() => pick(p.id)}>
					<Avatar markup={portal.avatarFor(p)} />
					<span class="nm">{p.name}</span>
				</button>
			{/each}
		</div>
	{/if}

	<div class="who-new">
		<p class="who-sub" style="flex: 1 1 100%; margin: 0">Make a new explorer</p>
		<div class="avatar-make">
			<Avatar markup={previewMarkup} cls="avatar-preview" />
			<button type="button" class="btn" onclick={shuffle}>🎲 Shuffle</button>
		</div>
		<div class="who-fields">
			<label for="whoName">Your name</label>
			<input
				id="whoName"
				type="text"
				maxlength="16"
				placeholder="Type your name"
				autocomplete="off"
				bind:value={name}
			/>
		</div>
	</div>
	<div class="who-actions">
		<button type="button" class="btn btn-primary" onclick={start}>Start exploring &rarr;</button>
	</div>
</div>
