<!-- Settings — reading level (global), church-colour preview, sounds, and theme. Reading level
     lives here, not on Home. Every change writes straight through to $lib/state. -->
<script lang="ts">
	import Icon from '../Icon.svelte';
	import { getPortal } from '../portal.svelte';
	import type { LitKey } from '../liturgy';
	import type { Tier } from '$lib/state';

	const portal = getPortal();

	const TIERS: { tier: Tier; label: string; ages: string }[] = [
		{ tier: 1, label: 'Seedling', ages: '4–6' },
		{ tier: 2, label: 'Explorer', ages: '7–9' },
		{ tier: 3, label: 'Scholar', ages: '10–13' }
	];

	const LITS: { key: LitKey; label: string }[] = [
		{ key: 'white', label: 'White' },
		{ key: 'red', label: 'Red' },
		{ key: 'green', label: 'Green' },
		{ key: 'violet', label: 'Violet' },
		{ key: 'black', label: 'Black' },
		{ key: 'rose', label: 'Rose' }
	];

	const note = $derived.by(() => {
		const t = portal.today;
		const preview = portal.litPreview;
		if (preview && preview !== t.litKey) {
			const label = LITS.find((l) => l.key === preview)?.label ?? '';
			return `Previewing ${label}. Today is ${t.season}.`;
		}
		return `Today is ${t.season} — the Church wears ${t.colourName.toLowerCase()}.`;
	});
</script>

<div class="room-hero">
	<Icon id="ic-settings" />
	<div>
		<h2>Settings</h2>
		<p>Make Bosco yours &mdash; it all stays on this computer.</p>
	</div>
</div>
<div class="settings-body">
	<div class="set-row">
		<div class="set-label">
			Reading level<small>How grown-up the words are, everywhere on the site.</small>
		</div>
		<div class="seg" role="group" aria-label="Reading level">
			{#each TIERS as t (t.tier)}
				<button
					type="button"
					aria-pressed={portal.prefs.tier === t.tier}
					onclick={() => portal.setTier(t.tier)}
				>
					{t.label}<small>{t.ages}</small>
				</button>
			{/each}
		</div>
	</div>

	<div class="set-row">
		<div class="set-label">
			Church colours<small>The desktop follows the Kalendar. Tap a colour to preview another.</small
			>
		</div>
		<div class="legend-wrap">
			<ul class="legend">
				{#each LITS as l (l.key)}
					<li>
						<button
							type="button"
							aria-pressed={portal.litKey === l.key}
							data-today={l.key === portal.today.litKey ? '' : undefined}
							onclick={() => portal.previewLit(l.key)}
						>
							<span class="chip c-{l.key}" aria-hidden="true"></span>{l.label}
						</button>
					</li>
				{/each}
			</ul>
			<p class="lit-note">{note}</p>
		</div>
	</div>

	<div class="set-row">
		<div class="set-label">Sounds<small>Gentle clicks and chimes as you explore.</small></div>
		<div class="seg" role="group" aria-label="Sounds">
			<button type="button" aria-pressed={portal.soundOn} onclick={() => portal.setMuted(false)}
				>On</button
			>
			<button type="button" aria-pressed={!portal.soundOn} onclick={() => portal.setMuted(true)}
				>Off</button
			>
		</div>
	</div>

	<div class="set-row">
		<div class="set-label">
			Look<small>The soft &ldquo;Meadow&rdquo; theme arrives later.</small>
		</div>
		<div class="seg" role="group" aria-label="Theme">
			<button type="button" aria-pressed={true}>Clubhouse</button>
			<button type="button" aria-pressed={false} disabled>Meadow (soon)</button>
		</div>
	</div>
</div>
