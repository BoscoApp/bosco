import { defineConfig } from '@playwright/test';

// Serves the built static output (build/) with sirv — the same static files the Docker/nginx image
// serves — so the offline smoke exercises real production output. Run `npm run build` first (CI
// does; locally `npm run build && npm run test:e2e`).
export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.e2e.{ts,js}',
	use: { baseURL: 'http://localhost:4173' },
	webServer: {
		command: 'npm run serve:build',
		port: 4173,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
