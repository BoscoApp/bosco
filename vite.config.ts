import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { boscoContent } from './src/lib/content/plugin';

export default defineConfig({
	plugins: [boscoContent(), sveltekit()],
	test: {
		// src/** unit tests, plus guard-script and authoring-time-tooling logic under scripts/** (pure
		// .mjs cores exercised directly — the content pipeline with a deterministic fake generator, the
		// SVG guard against hand-built fixtures — zero network in CI).
		include: ['src/**/*.{test,spec}.{js,ts}', 'scripts/**/*.{test,spec}.{js,ts}']
	}
});
