import { describe, it, expect } from 'vitest';
import calendar from './data/calendar.json';
import {
	getDay,
	saintOfDayLabel,
	isNotableFeast,
	upcomingFeasts,
	type LiturgicalColor,
	type LiturgicalDay
} from './index';

// Guards the introibo -> Bosco calendar transform against regressions. Dates are constructed with
// local components (month is 0-indexed) so they match the reader's local-date keying.
const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

// A synthetic day for exercising the pure predicates without pinning to a calendar date.
const litDay = (over: Partial<LiturgicalDay>): LiturgicalDay => ({
	date: '2026-01-01',
	season: 'Time after Pentecost',
	color: 'white',
	feast: 'Some Feast',
	rank: 'IV',
	observanceId: 'roman:temporale:x',
	...over
});

const VALID_COLORS: readonly LiturgicalColor[] = [
	'green',
	'violet',
	'white',
	'gold',
	'red',
	'rose',
	'black'
];

describe('liturgical calendar (introibo-vendored)', () => {
	it('names Bosco’s patron on his feast, in white', () => {
		const day = getDay(d(2026, 1, 31))!;
		expect(day.feast).toBe('Saint John Bosco');
		expect(day.color).toBe('white');
		expect(saintOfDayLabel(day)).toBe('Saint John Bosco');
	});

	it('lifts Class I white feasts to gold (Christmas, Easter)', () => {
		expect(getDay(d(2025, 12, 25))!).toMatchObject({ feast: 'Christmas Day', color: 'gold' });
		expect(getDay(d(2026, 4, 5))!).toMatchObject({ feast: 'Easter Sunday', color: 'gold' });
	});

	it('uses rose for Gaudete and Laetare', () => {
		expect(getDay(d(2025, 12, 14))!.color).toBe('rose');
		expect(getDay(d(2026, 3, 15))!.color).toBe('rose');
	});

	it('keeps the penitential and martyr colours', () => {
		expect(getDay(d(2026, 2, 1))!).toMatchObject({ season: 'Septuagesima', color: 'violet' });
		expect(getDay(d(2026, 2, 18))!).toMatchObject({ feast: 'Ash Wednesday', color: 'violet' });
		expect(getDay(d(2026, 4, 3))!).toMatchObject({ feast: 'Good Friday', color: 'black' });
		expect(getDay(d(2026, 5, 24))!).toMatchObject({ feast: 'Pentecost Sunday', color: 'red' });
	});

	it('labels an unnamed feria by its season', () => {
		const day = getDay(d(2026, 7, 6))!;
		expect(day.feast).toBeNull();
		expect(saintOfDayLabel(day)).toBe('Feria — Time after Pentecost');
	});

	it('returns null outside the vendored range', () => {
		expect(getDay(d(1900, 1, 1))).toBeNull();
	});

	it('only ever emits valid liturgical colours across the whole dataset', () => {
		const colors = new Set(
			Object.values(calendar as Record<string, { color: string }>).map((e) => e.color)
		);
		for (const c of colors) expect(VALID_COLORS).toContain(c as LiturgicalColor);
	});

	it('carries the ObservanceId join key on every day', () => {
		// A feast exposes its sanctorale id (the Library↔calendar join, #31)…
		expect(getDay(d(2026, 1, 31))!.observanceId).toBe('roman:sanctorale:ioannes-bosco');
		// …and even an unnamed feria carries its (temporal) id, never null within the vendored range.
		const feria = getDay(d(2026, 7, 6))!;
		expect(feria.feast).toBeNull();
		expect(feria.observanceId).toMatch(/^roman:temporale:/);
	});
});

describe('isNotableFeast (Portal look-ahead filter)', () => {
	it('includes curated sanctorale feasts and Class I temporal feasts', () => {
		expect(
			isNotableFeast(litDay({ observanceId: 'roman:sanctorale:ioannes-bosco', rank: 'III' }))
		).toBe(true);
		expect(
			isNotableFeast(litDay({ observanceId: 'roman:temporale:paschal:easter', rank: 'I' }))
		).toBe(true);
	});

	it('excludes ordinary numbered Sundays (curated but temporal, rank II)', () => {
		expect(
			isNotableFeast(
				litDay({ observanceId: 'roman:temporale:paschal:pentecost-time:sunday-17', rank: 'II' })
			)
		).toBe(false);
	});

	it('excludes un-Englished saints (no curated name) and plain ferias', () => {
		// A saint present in the calendar but not yet in names.ts falls back to Latin — held back.
		expect(
			isNotableFeast(litDay({ observanceId: 'roman:sanctorale:dominicus', rank: 'III' }))
		).toBe(false);
		expect(isNotableFeast(litDay({ feast: null }))).toBe(false);
	});
});

describe('upcomingFeasts (Portal look-ahead)', () => {
	it('returns the next notable feasts in date order, all after `from`', () => {
		const from = d(2026, 8, 1);
		const feasts = upcomingFeasts(from, { limit: 4 });
		expect(feasts.map((f) => f.date)).toEqual([
			'2026-08-06',
			'2026-08-10',
			'2026-08-14',
			'2026-08-15'
		]);
		expect(feasts.map((f) => f.feast)).toEqual([
			'The Transfiguration',
			'Saint Lawrence',
			'Vigil of the Assumption',
			'The Assumption'
		]);
		for (const f of feasts) expect(isNotableFeast(f)).toBe(true);
	});

	it('respects the limit', () => {
		expect(upcomingFeasts(d(2026, 8, 1), { limit: 2 })).toHaveLength(2);
	});

	it('never echoes `from` itself back as upcoming', () => {
		// 31 Jan is St John Bosco (a notable feast) — as the anchor it must be excluded.
		const feasts = upcomingFeasts(d(2026, 1, 31), { limit: 3 });
		expect(feasts.map((f) => f.date)).not.toContain('2026-01-31');
		expect(feasts[0].date > '2026-01-31').toBe(true);
	});

	it('returns nothing outside the vendored range', () => {
		expect(upcomingFeasts(d(1900, 1, 1))).toEqual([]);
	});
});
