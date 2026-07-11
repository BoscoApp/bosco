import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { boscoContent } from './src/lib/content/plugin';

export default defineConfig({
	plugins: [boscoContent(), sveltekit()],
	test: {
		// src/** unit tests, plus the authoring-time content-pipeline tooling under scripts/content/**
		// (pure .mjs core exercised with a deterministic fake generator — zero network in CI).
		include: ['src/**/*.{test,spec}.{js,ts}', 'scripts/content/**/*.{test,spec}.{js,ts}']
	}
});
