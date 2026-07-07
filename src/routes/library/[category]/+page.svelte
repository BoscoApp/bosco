<script lang="ts">
	import { APP_NAME } from '$lib/meta';
	import { CATEGORY_LABEL } from '$lib/library/categories';
	import CategoryView from '$lib/library/CategoryView.svelte';
	import StandaloneChrome from '$lib/library/StandaloneChrome.svelte';

	let { data } = $props();
	const label = $derived(CATEGORY_LABEL[data.category]);
</script>

<svelte:head>
	<title>{label} — The Library — {APP_NAME}</title>
	<meta name="description" content="Browse the {label} shelf of the Bosco Library." />
</svelte:head>

<StandaloneChrome title="{label} — The Library">
	<CategoryView category={data.category} />
</StandaloneChrome>
