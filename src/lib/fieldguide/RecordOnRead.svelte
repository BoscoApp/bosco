<!--
	Record-on-read — the card album's WRITE path. Reading a creature's Library article quietly records
	a card for the active child; this component is where that happens, kept deliberately OUT of the
	presentational ArticleView so the article itself stays a pure, state-free view. Mount one
	`<RecordOnRead {topic} />` beside every ArticleView (the standalone route + the two desktop windows).
	It renders no DOM and only runs a one-shot side effect.

	Records the creature ONCE, at mount, against whatever profile is active right then. It fires from
	`onMount`, NOT an `$effect`, so `activeProfile` is deliberately not a reactive dependency: switching
	profiles while the article stays open records nothing new, and re-reading (a fresh mount) is a no-op
	because `recordCard` is idempotent. Silent, creatures-only, and a safe no-op with no active profile.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { getStore, recordCard } from '$lib/state';
	import type { Topic } from '$lib/content';

	let { topic }: { topic: Topic } = $props();

	onMount(() => {
		// onMount is already client-only; the `browser` guard makes the "never touch the SSR store"
		// invariant explicit, and keeps this correct if the record ever moves out of onMount.
		if (!browser || topic.category !== 'creatures') return;
		// Fire-and-forget. recordCard resolves the album's collection key synchronously — before its
		// first await — so the active profile is snapshotted at mount, and it no-ops (never throws)
		// when there is none. A profile switch after this point cannot redirect the write.
		//
		// The album is a quiet nicety, never load-bearing: if the underlying storage is unavailable
		// (private mode, quota, a locked-down device), swallow the failure so a missed record can never
		// surface as an unhandled rejection or intrude on reading.
		void recordCard(getStore(), topic.slug).catch(() => {});
	});
</script>
