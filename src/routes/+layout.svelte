<script lang="ts">
	// Fonts (bundled via @fontsource through Vite — no CDN, no runtime request). Subset to Latin +
	// Latin-Extended so the Latin prayers render correctly while keeping the payload small.
	import '@fontsource/atkinson-hyperlegible/latin-400.css';
	import '@fontsource/atkinson-hyperlegible/latin-700.css';
	import '@fontsource/atkinson-hyperlegible/latin-ext-400.css';
	import '@fontsource/press-start-2p/latin-400.css';

	// Design tokens, in cascade order: primitives -> liturgical -> semantic -> themes -> base.
	import '$lib/styles/tokens.css';
	import '$lib/styles/liturgical.css';
	import '$lib/styles/semantic.css';
	import '$lib/styles/themes/clubhouse.css';
	import '$lib/styles/themes/meadow.css';
	import '$lib/styles/base.css';

	import favicon from '$lib/assets/favicon.svg';
	import { settings } from '$lib/state/store.svelte';
	import TierSwitch from '$lib/components/TierSwitch.svelte';
	import RetroButton from '$lib/components/RetroButton.svelte';

	let { children } = $props();

	// Keep <html data-theme> in sync with the persisted theme after hydration. app.html sets the
	// initial value before first paint to avoid a flash.
	$effect(() => {
		document.documentElement.setAttribute('data-theme', settings.theme);
	});

	function toggleTheme() {
		settings.theme = settings.theme === 'clubhouse' ? 'meadow' : 'clubhouse';
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<a class="skip-link" href="#main">Skip to content</a>

<header class="site-header">
	<a class="wordmark" href="/">Bosco</a>
	<nav class="header-controls" aria-label="Site settings">
		<TierSwitch />
		<RetroButton onclick={toggleTheme} aria-pressed={settings.theme === 'meadow'}>Theme</RetroButton
		>
		<RetroButton onclick={() => settings.toggleMute()} aria-pressed={settings.muted}>
			{settings.muted ? 'Muted' : 'Sound'}
		</RetroButton>
	</nav>
</header>

<main id="main" class="site-main">
	{@render children()}
</main>

<style>
	.skip-link {
		position: absolute;
		left: var(--space-1);
		top: -3rem;
		background: var(--color-surface);
		color: var(--color-text);
		padding: var(--space-1) var(--space-2);
		border: var(--border-width-2) solid var(--color-focus-ring);
		border-radius: var(--radius-1);
		transition: top var(--transition-fast);
		z-index: var(--z-overlay);
	}

	.skip-link:focus {
		top: var(--space-1);
	}

	.site-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		background: var(--color-surface);
		border-bottom: var(--border-width-2) solid var(--color-border);
		position: sticky;
		top: 0;
		z-index: var(--z-header);
	}

	.wordmark {
		font-family: var(--font-chrome);
		font-size: var(--font-size-2);
		color: var(--color-accent);
		text-decoration: none;
	}

	.header-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
	}

	.site-main {
		max-width: 70rem;
		margin: 0 auto;
		padding: var(--space-4);
	}
</style>
