import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * Bosco ships as a fully-prerendered static site. `adapter-static` with `strict: true`
 * fails the build if any route cannot be prerendered — a hard offline invariant, not a
 * preference. See docs/architecture/offline-invariant.md.
 *
 * @type {import('@sveltejs/kit').Config}
 */
const config = {
	preprocess: vitePreprocess(),
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
