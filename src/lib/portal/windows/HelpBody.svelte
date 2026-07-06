<!-- Help — a quick tour of the desktop. -->
<script lang="ts">
	import Icon from '../Icon.svelte';
	import { getPortal } from '../portal.svelte';

	const portal = getPortal();
	function open(id: string, e: MouseEvent) {
		portal.wm.open(id, e.currentTarget as HTMLElement);
	}
</script>

<div class="room-hero">
	<Icon id="ic-help" />
	<div>
		<h2>How Bosco works</h2>
		<p>A quick tour of your desktop.</p>
	</div>
</div>
<div class="help-body">
	<h3>Open a place</h3>
	<p>
		Click any picture on your desktop, or a door in the <b>Home</b> window. Each opens in its own window,
		and shows up in the bar along the bottom.
	</p>
	<h3>Your windows</h3>
	<p>
		<span class="keycap">&minus;</span> tucks a window into the bottom bar,
		<span class="keycap">&#9633;</span>
		makes it fill the screen, and
		<span class="keycap">&times;</span> closes it. Drag a window by its title bar to move it; press
		<span class="keycap">Esc</span> to close the one you&rsquo;re in.
	</p>
	<h3>The menu at the top</h3>
	<p>
		<b>Home</b> brings back the welcome window; <b>Settings</b> is where you set your reading level;
		<b>Chapel</b>
		and <b>Library</b> jump you straight in.
	</p>
	<p style="margin-top: 14px">
		<button type="button" class="btn" onclick={(e) => open('win-about', e)}
			>About Bosco &rarr;</button
		>
	</p>
</div>
