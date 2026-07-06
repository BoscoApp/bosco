<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { APP_NAME } from '$lib/meta';

	const status = $derived(page.status);
	const isMissing = $derived(status === 404);
	const heading = $derived(isMissing ? 'This door doesn’t open' : 'Something went sideways');
	const message = $derived(
		isMissing
			? 'We looked high and low, but there’s no page here. Even the best explorers take a wrong turn.'
			: 'Bosco tripped over something. Try heading back to the desktop and starting again.'
	);
</script>

<svelte:head>
	<title>{status} — {APP_NAME}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="err-scene">
	<div
		class="err-window"
		role="alertdialog"
		aria-labelledby="err-heading"
		aria-describedby="err-msg"
	>
		<div class="err-title">
			<span class="err-title-name">{APP_NAME} — bosco.kids</span>
			<span class="err-title-fill" aria-hidden="true"></span>
		</div>
		<div class="err-body">
			<p class="err-code" aria-hidden="true">{status}</p>
			<h1 id="err-heading">{heading}</h1>
			<p id="err-msg" class="err-msg">{message}</p>
			<a class="err-home" href="{base}/">&larr; Back to the desktop</a>
		</div>
	</div>
	<p class="err-foot">Made with love for God’s children · bosco.kids</p>
</main>

<style>
	.err-scene {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 18px;
		min-height: 100vh;
		padding: 24px;
		background: radial-gradient(
			135% 115% at 50% -12%,
			color-mix(in srgb, var(--lit) 78%, #ffffff) 0%,
			var(--lit) 44%,
			var(--lit-dk) 100%
		);
	}
	.err-window {
		width: min(460px, 100%);
		background: var(--window-bg);
		border: 1px solid var(--edge-strong);
		border-radius: 7px 7px 4px 4px;
		box-shadow: var(--shadow-win);
	}
	.err-title {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 24px;
		padding: 0 10px;
		border-radius: 6px 6px 0 0;
		border-bottom: 1px solid var(--edge);
		background: var(--surface-titlebar);
		font-family: var(--font-ui);
		font-size: 12px;
		font-weight: bold;
	}
	.err-title-fill {
		flex: 1 1 auto;
		height: 11px;
		opacity: 0.45;
		background: repeating-linear-gradient(var(--tb-stripe) 0 1px, transparent 1px 3px);
	}
	.err-body {
		margin: 3px;
		padding: 26px 24px 28px;
		text-align: center;
		background: var(--paper);
		border: 1px solid var(--edge);
		border-top: none;
		border-radius: 2px 2px 3px 3px;
	}
	.err-code {
		margin: 0 0 14px;
		font-family: var(--font-display);
		font-size: 40px;
		line-height: 1;
		color: var(--gold-deep);
		text-shadow: 2px 2px 0 color-mix(in srgb, var(--gold) 30%, var(--paper));
	}
	.err-body h1 {
		margin: 0 0 8px;
		font-family: var(--font-ui);
		font-size: 20px;
		color: var(--ink);
	}
	.err-msg {
		margin: 0 auto 20px;
		max-width: 42ch;
		font-size: 13.5px;
		color: var(--ink-soft);
	}
	.err-home {
		display: inline-block;
		font-family: var(--font-ui);
		font-size: 13px;
		text-decoration: none;
		color: #ffffff;
		padding: 9px 16px;
		border: 1px solid var(--sel-deep);
		border-radius: 7px;
		background: linear-gradient(color-mix(in srgb, var(--sel) 80%, #ffffff), var(--sel-deep));
		box-shadow: 0 1px 0 #ffffff inset;
	}
	.err-home:hover,
	.err-home:focus-visible {
		background: linear-gradient(var(--sel), var(--sel-deep));
		outline: 2px solid #ffffff;
		outline-offset: 2px;
	}
	.err-foot {
		margin: 0;
		font-family: var(--font-ui);
		font-size: 11.5px;
		color: var(--on-lit);
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
	}
</style>
