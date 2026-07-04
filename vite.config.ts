import { mdsvex } from 'mdsvex';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import mdsvexConfig from './mdsvex.config.js';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for our own .svelte files, but let mdsvex-generated .md/.svx
				// output compile in legacy mode (it emits `{...$$props}`/`<slot>` around the
				// Layout wrapper, which runes mode rejects). node_modules stays auto-detected.
				runes: ({ filename }) => {
					const parts = filename.split(/[/\\]/);
					if (parts.includes('node_modules')) return undefined;
					if (filename.endsWith('.md') || filename.endsWith('.svx')) return undefined;
					return true;
				}
			},
			// adapter-static: strict + no SPA fallback => every route must prerender or the
			// build fails. That "fails the build" behaviour is a deliberate deployment invariant
			// (DreamHost serves static files only; Docker/PWA parity depends on it).
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: undefined,
				precompress: true,
				strict: true
			}),
			// Relative asset paths so the identical build works under nginx (Docker), a DreamHost
			// subpath, and file:// contexts without a hardcoded origin.
			paths: { relative: true },
			// Any un-prerenderable link or id is a build error, not a silent runtime 404.
			prerender: { handleHttpError: 'fail', handleMissingId: 'fail' },
			preprocess: [mdsvex(mdsvexConfig)],
			extensions: ['.svelte', '.svx', '.md']
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
