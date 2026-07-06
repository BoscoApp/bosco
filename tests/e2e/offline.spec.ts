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
	await expect(page.getByRole('heading', { name: 'Bosco' })).toBeVisible();

	await page.goto('/library/');
	await expect(page.getByRole('heading', { name: 'The Library' })).toBeVisible();
	await expect(page.getByText('The Red Fox')).toBeVisible();

	expect(external, `unexpected external requests: ${external.join(', ')}`).toHaveLength(0);
});
