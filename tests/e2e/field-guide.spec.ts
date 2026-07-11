import { test, expect } from '@playwright/test';

/**
 * The Field Guide (v0.4.0 FG-3a). A second way into the Library's creatures — browse by habitat/kind,
 * open a creature inline in the desktop window (a pure store move, never a SvelteKit nav), or deep-link
 * to the prerendered hub. In the production build the draft basilisk is gated out, so the fox is the
 * only creature and appears under Woodland/Farmland (habitat) and Mammals (kind).
 */

async function enterAsExplorer(page: import('@playwright/test').Page) {
	await page.goto('/');
	await page.waitForSelector('#win-who:not([hidden])');
	await page.fill('#whoName', 'Rose');
	await page.click('#win-who .btn-primary');
	await page.waitForSelector('#win-home:not([hidden])');
}

/** Open the Field Guide window from the dock (there is no menu-bar entry for it). */
function openFieldGuide(page: import('@playwright/test').Page) {
	return page.locator('.dock .d-ico', { hasText: 'Field Guide' }).click();
}

test('the standalone Field Guide hub groups creatures by habitat and by kind', async ({ page }) => {
	await page.goto('/field-guide/');
	await expect(page.getByRole('heading', { name: 'The Field Guide', level: 1 })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'By habitat' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'By kind' })).toBeVisible();
	// The fox is the only approved creature: it lives in Woodland + Farmland and is a Mammal.
	await expect(page.getByRole('heading', { name: 'Woodland' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Mammals' })).toBeVisible();
	await expect(page.getByRole('link', { name: /The Red Fox/ }).first()).toBeVisible();
	await expect(page.getByRole('link', { name: /Open in Bosco/ })).toBeVisible();
});

test('opening a creature in the Field Guide window renders inline without navigating', async ({
	page
}) => {
	await enterAsExplorer(page);
	// Open a second window (Help) first, to prove the store move preserves other open windows.
	await page.getByRole('button', { name: 'Help', exact: true }).click();
	await openFieldGuide(page);
	const guide = page.locator('#win-fieldguide');
	await expect(guide).toBeVisible();
	await expect(guide.getByRole('heading', { name: 'The Field Guide' })).toBeVisible();

	await guide
		.getByRole('link', { name: /The Red Fox/ })
		.first()
		.click();

	// It rendered in-window: the article shows, the URL never changed, and Help survived.
	await expect(guide.getByRole('heading', { name: 'The Red Fox' })).toBeVisible();
	await expect(page).toHaveURL('http://localhost:4173/');
	await expect(page.locator('#win-help')).toBeVisible();

	// Back returns to the hub.
	await guide.getByRole('button', { name: /Back/ }).click();
	await expect(guide.getByRole('heading', { name: 'By habitat' })).toBeVisible();
});

test('a cross-category cross-link inside a Field Guide article opens inline (full /library claim)', async ({
	page
}) => {
	await enterAsExplorer(page);
	await openFieldGuide(page);
	const guide = page.locator('#win-fieldguide');
	await guide
		.getByRole('link', { name: /The Red Fox/ })
		.first()
		.click();
	await expect(guide.getByRole('heading', { name: 'The Red Fox' })).toBeVisible();

	// The fox article cross-links to world/printing-press — a DIFFERENT category. The Field Guide
	// intercept claims the FULL /library/ prefix, so it opens INLINE (never tearing down the desktop).
	const crosslink = guide.locator('.art-body').getByRole('link', { name: 'printing press' });
	await expect(crosslink).toHaveAttribute('href', /\/library\/world\/printing-press\/$/);
	await crosslink.click();
	await expect(guide.getByRole('heading', { name: 'The Printing Press' })).toBeVisible();
	await expect(page).toHaveURL('http://localhost:4173/');
});

test('a hub group heading opens its axis page in-window', async ({ page }) => {
	await enterAsExplorer(page);
	await openFieldGuide(page);
	const guide = page.locator('#win-fieldguide');
	// The "Woodland" habitat group heading is a link to that axis page.
	await guide.getByRole('link', { name: 'Woodland' }).click();
	await expect(guide.getByRole('heading', { name: 'Woodland' })).toBeVisible();
	await expect(guide.getByText('1 creature')).toBeVisible();
	await expect(page).toHaveURL('http://localhost:4173/');
	await expect(guide.getByRole('link', { name: /The Red Fox/ }).first()).toBeVisible();
});

test('a standalone axis page prerenders its filtered creatures', async ({ page }) => {
	await page.goto('/field-guide/kind/mammal/');
	await expect(page.getByRole('heading', { name: 'Mammals', level: 1 })).toBeVisible();
	await expect(page.getByRole('link', { name: /The Red Fox/ }).first()).toBeVisible();
	await expect(page.getByRole('link', { name: /Open in Bosco/ })).toBeVisible();
});

test('an axis page for a gated-out kind 404s in production (bestiary is basilisk-only)', async ({
	page
}) => {
	// `bestiary` is carried ONLY by the gated-out draft basilisk, so its axis page is never prerendered.
	const res = await page.goto('/field-guide/kind/bestiary/');
	expect(res?.status()).toBe(404);
});
