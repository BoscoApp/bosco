<script lang="ts">
	import { APP_NAME } from '$lib/meta';
	import FieldGuideHome from '$lib/fieldguide/FieldGuideHome.svelte';
	import StandaloneChrome from '$lib/library/StandaloneChrome.svelte';
</script>

<svelte:head>
	<title>The Field Guide — {APP_NAME}</title>
	<meta
		name="description"
		content="Browse God’s creatures by habitat or by kind — every one at three reading levels."
	/>
</svelte:head>

<StandaloneChrome title="The Field Guide">
	<FieldGuideHome />
</StandaloneChrome>
