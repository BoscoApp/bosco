<script lang="ts">
	import { APP_NAME } from '$lib/meta';
	import LibraryHome from '$lib/library/LibraryHome.svelte';
	import StandaloneChrome from '$lib/library/StandaloneChrome.svelte';
</script>

<svelte:head>
	<title>The Library — {APP_NAME}</title>
	<meta name="description" content="A kid’s encyclopedia — every topic at three reading levels." />
</svelte:head>

<StandaloneChrome title="The Library">
	<LibraryHome />
</StandaloneChrome>
