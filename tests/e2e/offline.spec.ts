import { test, expect } from '@playwright/test';

/**
 * The offline invariant at runtime: the running app must make no off-origin requests. We abort
 * anything not served from localhost and assert nothing was aborted.
 */
test('portal and library load with zero external requests', async ({ page }) => {
	const external: string[] = [];
	await page.route('**/*', (route) => {
		const url = new URL(route.request().url());
		if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
			route.continue();
		} else {
			external.push(url.href);
			route.abort();
		}
	});

	await page.goto('/');
	// First run shows the desktop with the "Who's exploring?" window open; the Bosco heading lives
	// in the Home window, which isn't open yet. Assert the always-present desktop landmark instead.
	await expect(page.locator('main.desktop')).toBeVisible();

	await page.goto('/library/');
	await expect(page.getByRole('heading', { name: 'The Library' })).toBeVisible();
	await expect(page.getByText('The Red Fox')).toBeVisible();

	// Exercise offline search too: loading the Pagefind runtime pulls its JS, wasm, index and result
	// fragments at runtime, so a search must drive all of those and still make zero off-origin requests.
	await page.getByRole('searchbox', { name: 'Search the Library' }).fill('fox');
	await expect(
		page.locator('.ls-results').getByRole('link', { name: /The Red Fox/ })
	).toBeVisible();

	expect(external, `unexpected external requests: ${external.join(', ')}`).toHaveLength(0);
});
