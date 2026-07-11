import { test, expect, type Page } from '@playwright/test';

/**
 * The card album, both halves.
 *
 * WRITE path (v0.4.0 FG-4): reading a creature's article records a card ONCE for the active child;
 * re-reading is a no-op (frozen timestamp), and switching profiles while an article stays open records
 * nothing to the newcomer. Those tests read the album straight out of IndexedDB.
 *
 * VIEW (v0.4.0 FG-5): the "My album" surface inside the Field Guide window renders the recorded cards
 * — records, not rewards (no count, no percent, no progress) — joining each slug to LIVE gated
 * frontmatter, so an un-published slug shows an inert frame that leaks no title. Those tests drive the
 * real UI.
 */

async function enterAsExplorer(page: Page, name = 'Rose') {
	await page.goto('/');
	await page.waitForSelector('#win-who:not([hidden])');
	await page.fill('#whoName', name);
	await page.click('#win-who .btn-primary');
	await page.waitForSelector('#win-home:not([hidden])');
}

/** Open the Field Guide window from the dock (there is no menu-bar entry for it). */
function openFieldGuide(page: Page) {
	return page.locator('.dock .d-ico', { hasText: 'Field Guide' }).click();
}

/** Open the album from the Field Guide window chrome (its "My album" button, present on every view). */
function openAlbum(page: Page) {
	return page.locator('#win-fieldguide').getByRole('button', { name: 'My album' }).click();
}

/**
 * The creature slugs recorded across ALL profiles' albums, read straight from IndexedDB. Uses
 * `indexedDB.databases()` first so it never CREATES the `bosco` DB — doing so could race the app's own
 * open and leave it storeless. Before the app has written anything, it simply reports an empty album.
 */
function albumSlugs(page: Page): Promise<string[]> {
	return page.evaluate(async () => {
		const dbs = await indexedDB.databases();
		if (!dbs.some((d) => d.name === 'bosco')) return [];
		return await new Promise<string[]>((resolve, reject) => {
			const req = indexedDB.open('bosco'); // no version → never upgrades/creates an existing DB
			req.onsuccess = () => {
				const db = req.result;
				if (!db.objectStoreNames.contains('records')) {
					db.close();
					resolve([]);
					return;
				}
				const all = db.transaction('records', 'readonly').objectStore('records').getAllKeys();
				all.onsuccess = () => {
					const keys = all.result as string[];
					db.close();
					// Keys are `${profileId}:album::${slug}`; a card per profile-and-slug.
					resolve(keys.filter((k) => k.includes(':album::')).map((k) => k.split('::')[1]));
				};
				all.onerror = () => {
					db.close();
					reject(all.error);
				};
			};
			req.onerror = () => reject(req.error);
		});
	});
}

/** The `updatedAt` of the first album card for `slug` in any profile (null if none) — for idempotency. */
function cardUpdatedAt(page: Page, slug: string): Promise<number | null> {
	return page.evaluate(async (wanted) => {
		// Same existence guard albumSlugs uses: never CREATE `bosco` here (a storeless v1 DB would
		// poison the app's own open). No DB yet → no card yet.
		const dbs = await indexedDB.databases();
		if (!dbs.some((d) => d.name === 'bosco')) return null;
		return await new Promise<number | null>((resolve, reject) => {
			const req = indexedDB.open('bosco');
			req.onsuccess = () => {
				const db = req.result;
				if (!db.objectStoreNames.contains('records')) {
					db.close();
					resolve(null);
					return;
				}
				const all = db.transaction('records', 'readonly').objectStore('records').getAll();
				all.onsuccess = () => {
					const rows = all.result as Array<{
						collection: string;
						record: { id: string; updatedAt: number };
					}>;
					const hit = rows.find((r) => r.collection.endsWith(':album') && r.record.id === wanted);
					db.close();
					resolve(hit ? hit.record.updatedAt : null);
				};
				all.onerror = () => {
					db.close();
					reject(all.error);
				};
			};
			req.onerror = () => reject(req.error);
		});
	}, slug);
}

test('reading a creature in the Field Guide records one card', async ({ page }) => {
	await enterAsExplorer(page);
	await openFieldGuide(page);
	const guide = page.locator('#win-fieldguide');
	await guide
		.getByRole('link', { name: /The Red Fox/ })
		.first()
		.click();
	await expect(guide.getByRole('heading', { name: 'The Red Fox' })).toBeVisible();

	await expect.poll(() => albumSlugs(page)).toEqual(['red-fox']);
});

test('re-reading the same creature keeps one card with a frozen timestamp', async ({ page }) => {
	await enterAsExplorer(page);
	await openFieldGuide(page);
	const guide = page.locator('#win-fieldguide');
	const fox = () => guide.getByRole('link', { name: /The Red Fox/ }).first();

	await fox().click();
	await expect(guide.getByRole('heading', { name: 'The Red Fox' })).toBeVisible();
	await expect.poll(() => albumSlugs(page)).toEqual(['red-fox']);
	const first = await cardUpdatedAt(page, 'red-fox');
	expect(first).not.toBeNull();

	// Back to the hub, then open the fox again — a FRESH RecordOnRead mount, but recordOnce is idempotent.
	await guide.getByRole('button', { name: /Back/ }).click();
	await expect(guide.getByRole('heading', { name: 'By habitat' })).toBeVisible();
	await fox().click();
	await expect(guide.getByRole('heading', { name: 'The Red Fox' })).toBeVisible();

	// Still exactly one card, and its timestamp never moved (no re-put).
	await expect.poll(() => albumSlugs(page)).toEqual(['red-fox']);
	expect(await cardUpdatedAt(page, 'red-fox')).toBe(first);
});

test('switching profiles while an article stays open records nothing new', async ({ page }) => {
	await enterAsExplorer(page, 'Rose');
	await openFieldGuide(page);
	const guide = page.locator('#win-fieldguide');
	await guide
		.getByRole('link', { name: /The Red Fox/ })
		.first()
		.click();
	await expect(guide.getByRole('heading', { name: 'The Red Fox' })).toBeVisible();
	await expect.poll(() => albumSlugs(page)).toEqual(['red-fox']); // Rose recorded the fox

	// Switch to a brand-new explorer WITHOUT touching the still-open fox article.
	await page.getByRole('button', { name: 'Switch explorer' }).click();
	await page.waitForSelector('#win-who:not([hidden])');
	await page.fill('#whoName', 'Finn');
	await page.click('#win-who .btn-primary');
	await expect(page.locator('.mb-profile .chip-name')).toHaveText('Finn'); // the switch settled

	// The fox article never re-mounted (onMount, not a reactive effect), so Finn recorded nothing:
	// still exactly Rose's single card.
	await expect(guide.getByRole('heading', { name: 'The Red Fox' })).toBeVisible();
	expect(await albumSlugs(page)).toEqual(['red-fox']);

	// Positive control: NOW re-opening the fox under Finn records a second, separate card — the write
	// path is intact, it just isn't triggered by a bare profile switch. (Switching to Finn opened the
	// Home window on top, so raise the Field Guide window from the dock before driving it again.)
	await openFieldGuide(page);
	await guide.getByRole('button', { name: /Back/ }).click();
	await expect(guide.getByRole('heading', { name: 'By habitat' })).toBeVisible();
	await guide
		.getByRole('link', { name: /The Red Fox/ })
		.first()
		.click();
	await expect(guide.getByRole('heading', { name: 'The Red Fox' })).toBeVisible();
	await expect.poll(() => albumSlugs(page)).toEqual(['red-fox', 'red-fox']); // Rose's + Finn's
});

test('a creature article with no active profile records nothing and never crashes', async ({
	page
}) => {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));

	// A fresh context has no profile; the standalone route mounts RecordOnRead all the same.
	await page.goto('/library/creatures/red-fox/');
	await expect(page.getByRole('heading', { name: 'The Red Fox' })).toBeVisible();

	// recordCard no-ops without a profile — the album DB is never even created — and nothing throws.
	await expect.poll(() => albumSlugs(page)).toEqual([]);
	expect(errors).toEqual([]);
});

// --- The album VIEW (FG-5) -------------------------------------------------------------------------

test('a recorded creature appears in the album as a linked card, and opens inline', async ({
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
	await expect.poll(() => albumSlugs(page)).toEqual(['red-fox']); // the write landed

	await openAlbum(page);
	// Every album transition moves focus to the view heading (keyboard/SR users land in the right place).
	await expect(guide.getByRole('heading', { name: 'My album' })).toBeFocused();

	const album = guide.locator('.album');
	const foxCard = album.getByRole('link', { name: /The Red Fox/ });
	await expect(foxCard).toBeVisible();
	await expect(foxCard).toHaveAttribute('href', /\/library\/creatures\/red-fox\/$/);

	// The album's card links ride the shared /library intercept — a click opens the article in-window.
	await foxCard.click();
	await expect(guide.getByRole('heading', { name: 'The Red Fox' })).toBeVisible();
	await expect(page).toHaveURL('http://localhost:4173/');
});

test('the album shows the pinned empty-state copy before anything is read', async ({ page }) => {
	await enterAsExplorer(page);
	await openFieldGuide(page);
	const guide = page.locator('#win-fieldguide');
	await openAlbum(page);
	await expect(guide.getByRole('heading', { name: 'My album' })).toBeVisible();
	await expect(guide.getByText('Creatures you’ve read about show up here.')).toBeVisible();
	await expect(guide.locator('.al-card')).toHaveCount(0);
});

test('with no active profile, the album invites making one and shows no cards', async ({
	page
}) => {
	await page.goto('/');
	await page.waitForSelector('#win-who:not([hidden])');
	// Dismiss "Who's exploring?" WITHOUT creating a profile — the desktop stays profile-less.
	await page.locator('#win-who').getByRole('button', { name: 'Close window' }).click();
	await openFieldGuide(page);
	const guide = page.locator('#win-fieldguide');
	await openAlbum(page);
	await expect(guide.getByText('Make a profile to start your own album.')).toBeVisible();
	await expect(guide.locator('.al-card')).toHaveCount(0);
});

test('the album is records-not-rewards: no progress, no count, no percent', async ({ page }) => {
	await enterAsExplorer(page);
	await openFieldGuide(page);
	const guide = page.locator('#win-fieldguide');
	await guide
		.getByRole('link', { name: /The Red Fox/ })
		.first()
		.click();
	await expect(guide.getByRole('heading', { name: 'The Red Fox' })).toBeVisible();
	await expect.poll(() => albumSlugs(page)).toEqual(['red-fox']);

	// The "My album" affordance in the window chrome carries no count (a `My album (3)` badge would
	// live OUTSIDE .album, so check it here while it's visible — it's hidden once the album is open).
	expect(await guide.getByRole('button', { name: /My album/ }).innerText()).not.toMatch(/\d/);

	await openAlbum(page);
	const album = guide.locator('.album');
	await expect(album.getByRole('link', { name: /The Red Fox/ })).toBeVisible();

	// No incentive markup anywhere in the rendered album…
	await expect(album.locator('progress')).toHaveCount(0);
	await expect(album.locator('meter')).toHaveCount(0);
	// …and the album's own CHROME — everything but the frontmatter-joined card title/summary — carries
	// no number and no percent. A count/percent line added ANYWHERE (header OR a footer under the grid,
	// the review's exact escape) fails here, not just in the header.
	const chrome = await album.evaluate((el) => {
		const clone = el.cloneNode(true) as HTMLElement;
		clone.querySelectorAll('.al-card-title, .al-card-summary').forEach((n) => n.remove());
		return clone.textContent ?? '';
	});
	expect(chrome).not.toMatch(/\d/);
	expect(chrome).not.toContain('%');
});

test('a recorded creature that is not currently published renders inert, leaking no title', async ({
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
	await expect.poll(() => albumSlugs(page)).toEqual(['red-fox']);

	// Seed a card for a slug gated OUT of this production build. `basilisk-draft` has no article here,
	// so it could never be recorded normally — inject it straight into the album collection to prove
	// the un-published join path (getTopic → undefined → inert frame, no title leak).
	await page.evaluate(async (slug) => {
		const state = JSON.parse(localStorage.getItem('bosco:state') ?? '{}');
		const collection = `${state.prefs.activeProfileId}:album`;
		const record = { id: slug, updatedAt: Date.now(), data: { v: 1 } };
		await new Promise<void>((resolve, reject) => {
			const req = indexedDB.open('bosco'); // existing DB (the fox created it); no version → no upgrade
			req.onsuccess = () => {
				const db = req.result;
				const tx = db.transaction('records', 'readwrite');
				tx.objectStore('records').put({ key: `${collection}::${slug}`, collection, record });
				tx.oncomplete = () => {
					db.close();
					resolve();
				};
				tx.onerror = () => {
					db.close();
					reject(tx.error);
				};
			};
			req.onerror = () => reject(req.error);
		});
	}, 'basilisk-draft');

	await openAlbum(page);
	const album = guide.locator('.album');
	// The fox still resolves to a titled, linked card…
	await expect(album.getByRole('link', { name: /The Red Fox/ })).toBeVisible();
	// …and the gated-out slug is an inert frame: the neutral note shows, the former title never does.
	await expect(album.getByText('This creature isn’t in the Library right now.')).toBeVisible();
	await expect(album).not.toContainText('Basilisk');
});
