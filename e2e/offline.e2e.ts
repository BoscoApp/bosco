import { test, expect, type Page } from '@playwright/test';

// The Phase 0 Done-when gate, encoded (brief §8): the styled Portal serves offline with working
// navigation and a working tier switch, and makes ZERO external network requests. We intercept
// every request and abort anything not served from localhost; if the page needs the network, the
// assertion at the end fails. This is the Docker-free stand-in for `docker run --network none`
// (Docker isn't installed on the authoring machine; CI verifies the actual image).
//
// Blocks + records every non-localhost request. Returns the list so a test can assert it stayed empty.
async function installOfflineGuard(page: Page): Promise<string[]> {
	const external: string[] = [];
	await page.route('**/*', (route) => {
		const host = new URL(route.request().url()).hostname;
		if (host === 'localhost' || host === '127.0.0.1') {
			route.continue();
		} else {
			external.push(route.request().url());
			route.abort();
		}
	});
	return external;
}

test('Portal serves offline with working nav and tier switch, zero external requests', async ({
	page
}) => {
	const external = await installOfflineGuard(page);

	// Portal renders.
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1, name: 'Bosco' })).toBeVisible();

	// Navigation works: Portal -> Library -> a topic.
	await page.locator('a.portal-tile', { hasText: 'The Library' }).click();
	await expect(page).toHaveURL(/\/library\/$/);
	await page.getByRole('link', { name: 'The Red Fox' }).click();
	await expect(page.getByRole('heading', { level: 1, name: 'The Red Fox' })).toBeVisible();

	// The global tier switch changes the rendered reading level (Explorer default -> Seedling).
	await expect(page.getByText('Reading level:')).toContainText('Explorer');
	await page.getByRole('button', { name: 'Seedling' }).click();
	await expect(page.getByText('Reading level:')).toContainText('Seedling');
	await expect(page.getByText('The red fox looks a little like a small dog.')).toBeVisible();

	// Search works offline: Pagefind fetches its index and fragments from the same origin only.
	await page.goto('/search/');
	const input = page.locator('input.pagefind-ui__search-input');
	await input.waitFor({ state: 'visible', timeout: 20_000 });
	// The search UI wears the Bosco skin: its font resolves to the bundled reading font, not the
	// stock system stack — proof the Pagefind token theming (#18) took effect in the built site.
	const font = await input.evaluate((el) => getComputedStyle(el).fontFamily);
	expect(font).toContain('Atkinson');
	await input.fill('fox');
	await expect(page.locator('.pagefind-ui__result-link').first()).toContainText(/fox/i, {
		timeout: 20_000
	});

	// The offline invariant: nothing reached the network.
	expect(external, `external requests were made: ${external.join(', ')}`).toHaveLength(0);
});

test('a #tier= link opens an article at that tier without changing the saved default', async ({
	page
}) => {
	const external = await installOfflineGuard(page);

	// A shareable deep link forces the Seedling reading level for this view only.
	await page.goto('/library/creatures/red-fox/#tier=seedling');
	await expect(page.getByRole('heading', { level: 1, name: 'The Red Fox' })).toBeVisible();
	await expect(page.getByText('Reading level:')).toContainText('Seedling');
	await expect(page.getByText('The red fox looks a little like a small dog.')).toBeVisible();

	// The reader's saved default is untouched: the same article without the hash is back to Explorer.
	await page.goto('/library/creatures/red-fox/');
	await expect(page.getByText('Reading level:')).toContainText('Explorer');
	await expect(page.getByText('The red fox looks a little like a small dog.')).not.toBeVisible();

	expect(external, `external requests were made: ${external.join(', ')}`).toHaveLength(0);
});

test('the Portal calendar surface renders today + a look-ahead, and the liturgical accent themes every page', async ({
	page
}) => {
	const external = await installOfflineGuard(page);
	const LIT_COLORS = ['green', 'violet', 'white', 'gold', 'red', 'rose', 'black'];

	// The Portal look-ahead (#33) hydrates from the bundled calendar and lists upcoming feasts.
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Coming up' })).toBeVisible();
	const feasts = page.locator('.upcoming li');
	expect(await feasts.count()).toBeGreaterThan(0);

	// Today's liturgical colour dresses the WHOLE app (#32): the accent is set on <html> from the
	// root layout, so it's present even on a page with no Saint-of-the-Day (e.g. the Library).
	await page.goto('/library/');
	await expect(page.getByRole('heading', { level: 1, name: 'The Library' })).toBeVisible();
	const lit = await page.evaluate(() => document.documentElement.getAttribute('data-lit'));
	expect(LIT_COLORS, `data-lit was "${lit}"`).toContain(lit);

	expect(external, `external requests were made: ${external.join(', ')}`).toHaveLength(0);
});

test('on a feast with a Library article, the Saint-of-the-Day links to it (#31 join)', async ({
	page
}) => {
	const external = await installOfflineGuard(page);

	// Pin "today" to St John Bosco's feast (31 Jan) so the client-side calendar resolves to a day
	// whose ObservanceId has a Faith article — proving the join renders as a link end to end.
	await page.clock.setFixedTime(new Date('2026-01-31T12:00:00'));
	await page.goto('/');

	const link = page.getByRole('link', { name: 'Saint John Bosco' });
	await expect(link).toBeVisible();
	await expect(link).toHaveAttribute('href', '/library/faith/saint-john-bosco/');

	// Following it lands on the article — the calendar is a real doorway into the Library.
	await link.click();
	await expect(page.getByRole('heading', { level: 1, name: 'St. John Bosco' })).toBeVisible();

	expect(external, `external requests were made: ${external.join(', ')}`).toHaveLength(0);
});
