<script lang="ts">
	import { getTopic, eagerBody, type Category } from '$lib/content';
	import { APP_NAME } from '$lib/meta';
	import ArticleView from '$lib/library/ArticleView.svelte';
	import StandaloneChrome from '$lib/library/StandaloneChrome.svelte';

	let { data } = $props();
	// Build-time data — present in the component on both server (prerender) and client. Derived so a
	// client-side navigation to another topic (reusing this component) resolves the new one.
	const topic = $derived(getTopic(data.category as Category, data.slug)!);
	const seed = $derived(eagerBody(topic.path) ?? null);
</script>

<svelte:head>
	<title>{topic.title} — The Library — {APP_NAME}</title>
	<meta name="description" content={topic.summary} />
</svelte:head>

<StandaloneChrome title={topic.title}>
	{#key topic.path}
		<ArticleView {topic} tier={topic.defaultTier} eager={seed} />
	{/key}
</StandaloneChrome>
