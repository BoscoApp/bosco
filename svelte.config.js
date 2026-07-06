import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

/**
 * Bosco ships as a fully-prerendered static site. `adapter-static` with `strict: true`
 * fails the build if any route cannot be prerendered — a hard offline invariant, not a
 * preference. See docs/architecture/offline-invariant.md.
 *
 * Content topics are authored as Markdown (`.md`) compiled by mdsvex; the folder-per-topic
 * loader and the doctrine gate live in `src/lib/content`.
 *
 * @type {import('@sveltejs/kit').Config}
 */
const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [vitePreprocess(), mdsvex({ extensions: ['.md'] })],
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: false,
			strict: true
		}),
		prerender: {
			handleHttpError: 'fail',
			handleMissingId: 'fail'
		}
	}
};

export default config;
