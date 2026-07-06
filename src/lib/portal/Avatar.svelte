<!--
	Renders avatar inner-SVG markup into a real <svg>. We set innerHTML on the bound element (rather
	than {@html}) so the injected nodes are created in the SVG namespace and actually paint.
-->
<script lang="ts">
	let { markup, cls = '' }: { markup: string; cls?: string } = $props();
	let el = $state<SVGSVGElement | null>(null);
	$effect(() => {
		if (el) el.innerHTML = markup;
	});
</script>

<svg bind:this={el} class={cls} viewBox="0 0 44 44" aria-hidden="true"></svg>
