<!--
	Renders our own room copy with `**bold**` spans as real <b> elements (no {@html}, so no XSS
	surface). Text between paired `**` markers becomes bold; everything else is plain.
-->
<script lang="ts">
	let { text }: { text: string } = $props();
	const parts = $derived(text.split('**'));
</script>

{#each parts as part, i (i)}{#if i % 2 === 1}<b>{part}</b>{:else}{part}{/if}{/each}
