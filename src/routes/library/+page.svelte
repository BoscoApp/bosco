<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>The Library — Bosco</title>
</svelte:head>

<main>
	<h1>The Library</h1>
	<p>{data.topics.length} topics published.</p>
	<ul>
		{#each data.topics as topic (topic.path)}
			<li>
				<strong>{topic.title}</strong> — {topic.category} · tiers {topic.tiers.join(', ')}
				<p>{topic.summary}</p>
			</li>
		{/each}
	</ul>
</main>
