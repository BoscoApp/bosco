import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import boscoRemark from './src/lib/content/remark-bosco.js';

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
	// boscoRemark rewrites inline `bosco:category/slug` links to real /library routes and validates
	// them against the shipping topic set (base is '' — see the base assertion in remark-bosco.test.ts).
	preprocess: [
		vitePreprocess(),
		mdsvex({ extensions: ['.md'], remarkPlugins: [boscoRemark({ base: '' })] })
	],
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			// A client-rendered fallback so static hosts serve a styled, in-world 404
			// (src/routes/+error.svelte) for any unknown path. All real routes still prerender.
			fallback: '404.html',
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
