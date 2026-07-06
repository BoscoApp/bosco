<script lang="ts">
	import Desktop from '$lib/portal/Desktop.svelte';
	import { APP_NAME } from '$lib/meta';
</script>

<svelte:head>
	<title>{APP_NAME} — a little internet for God’s children</title>
	<meta
		name="description"
		content="A quiet, offline little internet for traditional Catholic children — a library, a chapel, a field guide, an art studio, an arcade, and a typing trainer."
	/>
</svelte:head>

<Desktop />
