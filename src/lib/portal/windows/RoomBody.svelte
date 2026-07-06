<!-- A placeholder "room" (one of the six destinations). Chapel additionally shows today's colour
     and season from the calendar; the rest show an "opening in a later version" note. -->
<script lang="ts">
	import Icon from '../Icon.svelte';
	import RichText from '../RichText.svelte';
	import { getPortal } from '../portal.svelte';
	import { DAY_VERSE } from '../liturgy';
	import type { Room } from '../windows';

	let { room }: { room: Room } = $props();
	const portal = getPortal();
	const today = $derived(portal.today);
</script>

<div class="room-hero">
	<Icon id={room.icon} />
	<div>
		<h2>{room.title}</h2>
		<p>{room.blurb}</p>
	</div>
</div>
<div class="room-body">
	{#if room.kind === 'chapel'}
		<p>
			Today the Church wears <b>{today.colourName.toLowerCase()}</b>, in the season of
			<b>{today.season}</b>. {room.intro}
		</p>
	{:else}
		<p>{room.intro}</p>
	{/if}

	<ul class="room-list">
		{#each room.items as item, i (i)}
			<li><span class="bud" aria-hidden="true"></span><span><RichText text={item} /></span></li>
		{/each}
	</ul>

	{#if room.kind === 'chapel'}
		<div class="verse" style="max-width: 340px">
			<p class="lat">{DAY_VERSE.lat}</p>
			<p class="en">{DAY_VERSE.en}</p>
			<span class="ref">{DAY_VERSE.ref}</span>
		</div>
	{:else}
		<span class="soon">🔨 {room.soon}</span>
	{/if}
</div>
