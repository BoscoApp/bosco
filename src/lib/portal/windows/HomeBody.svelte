<!-- The Home window — the welcome "box": masthead, bulletin, the six doors, Day-of-the-Day, footer. -->
<script lang="ts">
	import Icon from '../Icon.svelte';
	import { getPortal } from '../portal.svelte';
	import { DOORS } from '../windows';
	import { DAY_VERSE } from '../liturgy';

	const portal = getPortal();
	const today = $derived(portal.today);

	function open(id: string, e: MouseEvent) {
		portal.wm.open(id, e.currentTarget as HTMLElement);
	}
</script>

<header class="masthead">
	<div class="crest" aria-hidden="true">
		<svg width="48" height="48" viewBox="0 0 52 52" role="img" aria-label="Open book with a cross"
			><use href="#ic-crest" /></svg
		>
	</div>
	<div class="mast-txt">
		<h1>Bosco</h1>
		<div class="mast-url">bosco.kids</div>
		<p class="tagline">
			A little internet for God&rsquo;s children &mdash; six doors into wonder, all quiet, all yours
			to explore.
		</p>
		<span class="colour-pill"
			><span class="sw" aria-hidden="true"></span>Today&rsquo;s colour:
			<b>{today.colourName}</b></span
		>
	</div>
	<aside class="balloon" role="note">
		<b>Welcome!</b> Point at any door to peek inside. Everything here is quiet, safe, and yours to explore.
		&#9786;
	</aside>
</header>

<div class="bulletin">
	<div class="tag"><span aria-hidden="true">📣</span> Bulletin</div>
	<div class="marquee" aria-label="Today's bulletin">
		<ul>
			<li>
				<span class="star" aria-hidden="true">✦</span> Welcome to bosco.kids &mdash; make yourself at
				home.
			</li>
			<li>
				<span class="star" aria-hidden="true">✦</span> The Church keeps her seasons &mdash; today&rsquo;s
				colour glows on your desktop.
			</li>
			<li>
				<span class="star" aria-hidden="true">✦</span> Three new creatures added to the Field Guide this
				week.
			</li>
			<li>
				<span class="star" aria-hidden="true">✦</span> &ldquo;It is enough that you are young for me to
				love you.&rdquo; &mdash; Don Bosco
			</li>
			<li aria-hidden="true">
				<span class="star">✦</span> Welcome to bosco.kids &mdash; make yourself at home.
			</li>
			<li aria-hidden="true">
				<span class="star">✦</span> The Church keeps her seasons &mdash; today&rsquo;s colour glows on
				your desktop.
			</li>
			<li aria-hidden="true">
				<span class="star">✦</span> Three new creatures added to the Field Guide this week.
			</li>
			<li aria-hidden="true">
				<span class="star">✦</span> &ldquo;It is enough that you are young for me to love you.&rdquo;
				&mdash; Don Bosco
			</li>
		</ul>
	</div>
</div>

<div class="grid-wrap">
	<div class="grid-head">
		<h2>Six doors</h2>
		<span>&mdash; click any one to go in</span>
	</div>
	<div class="grid">
		{#each DOORS as door (door.id)}
			<button type="button" class="tile" onclick={(e) => open(door.id, e)}>
				<Icon id={door.icon} />
				<div class="tile-txt">
					<span class="kicker k-{door.accent}">{door.kicker}</span>
					<h3>{door.title}</h3>
					<p>{door.blurb}</p>
				</div>
			</button>
		{/each}
	</div>
</div>

<section class="dayband" aria-label="Day of the Day">
	<p class="db-head">
		Day of the Day <span class="season">&mdash; {today.colourName} &middot; {today.season}</span>
	</p>
	<div class="db-grid">
		<div class="saint">
			<svg class="halo" viewBox="0 0 46 46" role="img" aria-label="Saint of the day"
				><use href="#ic-halo" /></svg
			>
			<div>
				<b>{today.title}</b>
				<small
					>{today.isSaint ? 'Honoured by the Church today.' : 'Today in the Church’s year.'}</small
				>
				<span class="feast"
					>{today.rank ? today.rank + ' · ' : ''}{today.dateLabel
						? today.dateLabel + ' · '
						: ''}{today.colourName}</span
				>
			</div>
		</div>
		<div class="verse">
			<p class="lat">{DAY_VERSE.lat}</p>
			<p class="en">{DAY_VERSE.en}</p>
			<span class="ref">{DAY_VERSE.ref}</span>
		</div>
	</div>
</section>

<footer class="foot">
	<div class="construction"><span>🚧 Under construction &mdash; more doors coming soon</span></div>
	<div class="foot-counter">
		<span class="odo" role="img" aria-label="Visitor counter: 0 0 1 4 7 2 6"
			><span>0</span><span>0</span><span>1</span><span>4</span><span>7</span><span>2</span><span
				>6</span
			></span
		> visitors
	</div>
	<div class="foot-links">
		<button type="button" onclick={(e) => open('win-about', e)}>About Bosco</button>
	</div>
</footer>
