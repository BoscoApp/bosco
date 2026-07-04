import { describe, it, expect } from 'vitest';
import calendar from './data/calendar.json';
import { getDay, saintOfDayLabel, type LiturgicalColor } from './index';

// Guards the introibo -> Bosco calendar transform against regressions. Dates are constructed with
// local components (month is 0-indexed) so they match the reader's local-date keying.
const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

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
});
