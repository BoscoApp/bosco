<script lang="ts">
	import { APP_NAME } from '$lib/meta';
	import { KIND_LABEL } from '$lib/fieldguide/axes';
	import AxisView from '$lib/fieldguide/AxisView.svelte';
	import StandaloneChrome from '$lib/library/StandaloneChrome.svelte';
	import type { CreatureKind } from '$lib/content';

	let { data } = $props();
	const label = $derived(KIND_LABEL[data.value as CreatureKind]);
</script>

<svelte:head>
	<title>{label} — The Field Guide — {APP_NAME}</title>
	<meta name="description" content="Creatures of this kind — {label} — in the Bosco Field Guide." />
</svelte:head>

<StandaloneChrome title="{label} — The Field Guide">
	<AxisView axis="kind" value={data.value} />
</StandaloneChrome>
