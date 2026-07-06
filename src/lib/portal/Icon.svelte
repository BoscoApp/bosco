<!-- References a symbol from <IconSprite>. Decorative by default (aria-hidden). -->
<script lang="ts">
	let { id, cls = 'art' }: { id: string; cls?: string } = $props();
</script>

<svg class={cls} viewBox="0 0 52 52" aria-hidden="true"><use href="#{id}" /></svg>
