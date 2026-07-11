import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * The v0.2.0 accessibility floor, checked with axe against the real prerendered build. Local /
 * pre-release only (not the required `ci` gate). We fail on `serious`/`critical` violations — the
 * floor — while surfacing any minor ones in the message.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

function seriousOf(results: {
	violations: { id: string; impact?: string | null; nodes: unknown[] }[];
}) {
	return results.violations
		.filter((v) => v.impact === 'serious' || v.impact === 'critical')
		.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
}

test.describe('accessibility floor', () => {
	test('the desktop (first run, Who window) has no serious/critical violations', async ({
		page
	}) => {
		await page.goto('/');
		await page.waitForSelector('#win-who:not([hidden])');
		const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
		expect(seriousOf(results), JSON.stringify(seriousOf(results), null, 2)).toEqual([]);
	});

	test('the desktop with the Home window open has no serious/critical violations', async ({
		page
	}) => {
		await page.goto('/');
		await page.waitForSelector('#win-who:not([hidden])');
		await page.fill('#whoName', 'Rose');
		await page.click('#win-who .btn-primary');
		await page.waitForSelector('#win-home:not([hidden])');
		const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
		expect(seriousOf(results), JSON.stringify(seriousOf(results), null, 2)).toEqual([]);
	});

	test('the styled error page has no serious/critical violations', async ({ page }) => {
		// The static host serves 404.html (the client-rendered fallback) for unknown paths.
		await page.goto('/404.html');
		await page.waitForSelector('.err-window');
		const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
		expect(seriousOf(results), JSON.stringify(seriousOf(results), null, 2)).toEqual([]);
	});

	test('the Library window with a topic open has no serious/critical violations', async ({
		page
	}) => {
		await page.goto('/');
		await page.waitForSelector('#win-who:not([hidden])');
		await page.fill('#whoName', 'Rose');
		await page.click('#win-who .btn-primary');
		await page.waitForSelector('#win-home:not([hidden])');
		await page.getByRole('button', { name: 'Library', exact: true }).click();
		const library = page.locator('#win-library');
		await library
			.getByRole('link', { name: /The Red Fox/ })
			.first()
			.click();
		await library.getByRole('heading', { name: 'The Red Fox' }).waitFor();
		const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
		expect(seriousOf(results), JSON.stringify(seriousOf(results), null, 2)).toEqual([]);
	});

	test('a standalone topic page has no serious/critical violations', async ({ page }) => {
		await page.goto('/library/creatures/red-fox/');
		await page.waitForSelector('.article');
		const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
		expect(seriousOf(results), JSON.stringify(seriousOf(results), null, 2)).toEqual([]);
	});

	test('the standalone Library home (with "Surprise me") has no serious/critical violations', async ({
		page
	}) => {
		await page.goto('/library/');
		await page.waitForSelector('.lib-home');
		const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
		expect(seriousOf(results), JSON.stringify(seriousOf(results), null, 2)).toEqual([]);
	});

	test('the standalone Field Guide hub has no serious/critical violations', async ({ page }) => {
		await page.goto('/field-guide/');
		await page.waitForSelector('.fg-home');
		const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
		expect(seriousOf(results), JSON.stringify(seriousOf(results), null, 2)).toEqual([]);
	});

	test('the Library home showing search results has no serious/critical violations', async ({
		page
	}) => {
		await page.goto('/library/');
		await page.getByRole('searchbox', { name: 'Search the Library' }).fill('fox');
		await page.waitForSelector('.ls-results .ls-hit');
		const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
		expect(seriousOf(results), JSON.stringify(seriousOf(results), null, 2)).toEqual([]);
	});
});
