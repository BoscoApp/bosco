import { test, expect } from '@playwright/test';

/**
 * The Library in the desktop window (v0.3.0 PR1). Opening a topic must browse IN the window — a pure
 * store move, never a SvelteKit navigation — so the URL stays put and other open windows survive.
 * The prerendered routes are the canonical, deep-linkable, offline face of the same views.
 */

async function enterAsExplorer(page: import('@playwright/test').Page) {
	await page.goto('/');
	await page.waitForSelector('#win-who:not([hidden])');
	await page.fill('#whoName', 'Rose');
	await page.click('#win-who .btn-primary');
	await page.waitForSelector('#win-home:not([hidden])');
}

test('browsing a topic in the Library window does not navigate and keeps other windows open', async ({
	page
}) => {
	await enterAsExplorer(page);

	// Open a second window (Help) and the Library from the menu bar.
	await page.getByRole('button', { name: 'Help', exact: true }).click();
	await page.getByRole('button', { name: 'Library', exact: true }).click();
	const library = page.locator('#win-library');
	await expect(library).toBeVisible();

	// Open a topic from within the window.
	await library
		.getByRole('link', { name: /The Red Fox/ })
		.first()
		.click();

	// It rendered in-window: the article heading is shown…
	await expect(library.getByRole('heading', { name: 'The Red Fox' })).toBeVisible();
	// …the URL never changed (no navigation)…
	await expect(page).toHaveURL('http://localhost:4173/');
	// …and the Help window we opened earlier is still there.
	await expect(page.locator('#win-help')).toBeVisible();

	// The default tier (Explorer) prose is present; switching to Seedling swaps the body in place.
	await expect(library.getByText(/most widespread wild member of the dog family/)).toBeVisible();
	await library.getByRole('button', { name: 'Seedling' }).click();
	await expect(library.getByText(/small wild dog/)).toBeVisible();
});

test('a topic deep link renders standalone with real prose and a way back', async ({ page }) => {
	await page.goto('/library/creatures/red-fox/');
	await expect(page.getByRole('heading', { name: 'The Red Fox' })).toBeVisible();
	await expect(page.getByText(/most widespread wild member of the dog family/)).toBeVisible();
	await expect(page.getByRole('link', { name: /Open in Bosco/ })).toBeVisible();
});
