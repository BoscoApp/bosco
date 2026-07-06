import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { boscoContent } from './src/lib/content/plugin';

export default defineConfig({
	plugins: [boscoContent(), sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
