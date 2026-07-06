import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against the real prerendered build served like the production container.
 * Run locally / pre-release: `pnpm exec playwright install chromium` once, then `pnpm test:e2e`.
 * Not part of the required `ci` gate (which uses the browser-free offline smoke); e2e is the
 * deeper browser-runtime proof.
 */
export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	reporter: 'list',
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry'
	},
	webServer: {
		command: 'pnpm build && pnpm serve:static 4173',
		port: 4173,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
