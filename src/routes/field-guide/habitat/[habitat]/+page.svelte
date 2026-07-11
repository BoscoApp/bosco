<script lang="ts">
	import { APP_NAME } from '$lib/meta';
	import { HABITAT_LABEL } from '$lib/fieldguide/axes';
	import AxisView from '$lib/fieldguide/AxisView.svelte';
	import StandaloneChrome from '$lib/library/StandaloneChrome.svelte';
	import type { Habitat } from '$lib/content';

	let { data } = $props();
	const label = $derived(HABITAT_LABEL[data.value as Habitat]);
</script>

<svelte:head>
	<title>{label} — The Field Guide — {APP_NAME}</title>
	<meta name="description" content="Creatures of the {label} habitat, in the Bosco Field Guide." />
</svelte:head>

<StandaloneChrome title="{label} — The Field Guide">
	<AxisView axis="habitat" value={data.value} />
</StandaloneChrome>
