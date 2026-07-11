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

test('a standalone topic page shows a "See also" section with its curated links', async ({
	page
}) => {
	await page.goto('/library/creatures/red-fox/');
	const seeAlso = page.locator('.see-also');
	await expect(seeAlso.getByRole('heading', { name: 'See also' })).toBeVisible();
	await expect(seeAlso.getByRole('link', { name: /The Printing Press/ })).toBeVisible();
});

test('a "See also" link browses to the related topic in-window without navigating', async ({
	page
}) => {
	await enterAsExplorer(page);
	// Open a second window (Help) first, to prove a See-also move preserves other open windows.
	await page.getByRole('button', { name: 'Help', exact: true }).click();
	await page.getByRole('button', { name: 'Library', exact: true }).click();
	const library = page.locator('#win-library');
	await expect(library).toBeVisible();

	// Open the Red Fox, then follow its "See also" link to the Printing Press.
	await library
		.getByRole('link', { name: /The Red Fox/ })
		.first()
		.click();
	await expect(library.getByRole('heading', { name: 'The Red Fox' })).toBeVisible();

	const seeAlso = library.locator('.see-also');
	await seeAlso.getByRole('link', { name: /The Printing Press/ }).click();

	// It moved in-window: the target article shows, the URL never changed (no SvelteKit nav), and the
	// Help window we opened earlier survived the store move.
	await expect(library.getByRole('heading', { name: 'The Printing Press' })).toBeVisible();
	await expect(page).toHaveURL('http://localhost:4173/');
	await expect(page.locator('#win-help')).toBeVisible();
});

test('the standalone Library search finds a topic and links to its page', async ({ page }) => {
	await page.goto('/library/');
	await page.getByRole('searchbox', { name: 'Search the Library' }).fill('fox');

	const results = page.locator('.ls-results');
	await expect(results.getByRole('link', { name: /The Red Fox/ })).toBeVisible();
	// The excerpt highlights the matched word.
	await expect(results.locator('mark', { hasText: 'fox' }).first()).toBeVisible();

	await results.getByRole('link', { name: /The Red Fox/ }).click();
	await expect(page).toHaveURL(/\/library\/creatures\/red-fox\/$/);
	await expect(page.getByRole('heading', { name: 'The Red Fox' })).toBeVisible();
});

test('a search result opens in-window without navigating and keeps other windows open', async ({
	page
}) => {
	await enterAsExplorer(page);
	// Open Help first, to prove a search-result move preserves other open windows.
	await page.getByRole('button', { name: 'Help', exact: true }).click();
	await page.getByRole('button', { name: 'Library', exact: true }).click();
	const library = page.locator('#win-library');
	await expect(library).toBeVisible();

	await library.getByRole('searchbox', { name: 'Search the Library' }).fill('printing');
	const result = library.locator('.ls-results').getByRole('link', { name: /The Printing Press/ });
	await expect(result).toBeVisible();
	await result.click();

	// It moved in-window: the target article shows, the URL never changed (no SvelteKit nav), and the
	// Help window survived the store move.
	await expect(library.getByRole('heading', { name: 'The Printing Press' })).toBeVisible();
	await expect(page).toHaveURL('http://localhost:4173/');
	await expect(page.locator('#win-help')).toBeVisible();
});

test('searching for something not in the Library shows a no-results message', async ({ page }) => {
	await page.goto('/library/');
	await page.getByRole('searchbox', { name: 'Search the Library' }).fill('qqzznotathing');
	await expect(page.getByText(/No articles matched/)).toBeVisible();
	await expect(page.locator('.ls-results')).toHaveCount(0);
});

test('an inline bosco: cross-link renders as a real Library link and opens in-window', async ({
	page
}) => {
	await enterAsExplorer(page);
	await page.getByRole('button', { name: 'Help', exact: true }).click();
	await page.getByRole('button', { name: 'Library', exact: true }).click();
	const library = page.locator('#win-library');
	await library
		.getByRole('link', { name: /The Red Fox/ })
		.first()
		.click();
	await expect(library.getByRole('heading', { name: 'The Red Fox' })).toBeVisible();

	// The Explorer prose carries an inline cross-link to the printing press (scoped to .art-body so the
	// "See also" card's link can't satisfy it). It's a real /library route, opened in-window.
	const crosslink = library.locator('.art-body').getByRole('link', { name: 'printing press' });
	await expect(crosslink).toHaveAttribute('href', /\/library\/world\/printing-press\/$/);
	await crosslink.click();

	await expect(library.getByRole('heading', { name: 'The Printing Press' })).toBeVisible();
	await expect(page).toHaveURL('http://localhost:4173/');
	await expect(page.locator('#win-help')).toBeVisible();
});

test('a standalone article inline cross-link navigates to the real route', async ({ page }) => {
	await page.goto('/library/creatures/red-fox/');
	const crosslink = page.locator('.art-body').getByRole('link', { name: 'printing press' });
	await expect(crosslink).toBeVisible();
	await crosslink.click();
	await expect(page).toHaveURL(/\/library\/world\/printing-press\/$/);
	await expect(page.getByRole('heading', { name: 'The Printing Press' })).toBeVisible();
});

test('a glossary term reveals its definition on tap and Esc dismisses it', async ({ page }) => {
	await enterAsExplorer(page);
	await page.getByRole('button', { name: 'Library', exact: true }).click();
	const library = page.locator('#win-library');
	await library
		.getByRole('link', { name: /The Red Fox/ })
		.first()
		.click();
	await expect(library.getByRole('heading', { name: 'The Red Fox' })).toBeVisible();

	// The Explorer prose marks "brush" as a glossary term — a button (not a link), whose accessible
	// name flags it. The definition bubble is absent until the term is activated.
	const term = library.getByRole('button', { name: /brush, glossary term/ });
	await expect(term).toBeVisible();
	const bubble = library.locator('.gloss-bubble');
	await expect(bubble).toBeHidden();

	await term.click();
	await expect(bubble).toBeVisible();
	await expect(bubble).toContainText('like a scarf'); // the brush definition

	// Esc dismisses the toggletip and returns focus to the term.
	await page.keyboard.press('Escape');
	await expect(bubble).toBeHidden();
	await expect(term).toBeFocused();
});

test('a glossary term works on the standalone prerendered article too', async ({ page }) => {
	await page.goto('/library/creatures/red-fox/');
	const term = page.getByRole('button', { name: /brush, glossary term/ });
	await expect(term).toBeVisible();
	await term.click();
	const bubble = page.locator('.gloss-bubble');
	await expect(bubble).toBeVisible();
	await expect(bubble).toContainText('like a scarf');

	// Clicking INSIDE the open bubble must NOT dismiss it — in Blink/WebKit pressing the non-focusable
	// bubble would otherwise blur the trigger and close the very definition a child just poked.
	await bubble.click();
	await expect(bubble).toBeVisible();
});

test('"Surprise me" re-rolls on the client and opens that pick in-window', async ({ page }) => {
	// The prerendered href is seeded to the first topic (Red Fox); the destination must come from the
	// CLIENT re-roll on focus/pointerdown, not the seed. Force the roll to the second topic and prove it
	// lands there — so a regression that dropped the re-roll (freezing on the seed) would fail here.
	await page.addInitScript(() => {
		Math.random = () => 0.99; // with two topics → Math.floor(0.99 * 2) = index 1 (world/printing-press)
	});
	await enterAsExplorer(page);
	await page.getByRole('button', { name: 'Library', exact: true }).click();
	const library = page.locator('#win-library');

	await library.getByRole('link', { name: 'Surprise me' }).click();

	// It re-rolled to the NON-seed topic and opened it in-window, URL unchanged.
	await expect(library.getByRole('heading', { name: 'The Printing Press' })).toBeVisible();
	await expect(library.getByText('Read as')).toBeVisible();
	await expect(page).toHaveURL('http://localhost:4173/');
});
