import { describe, it, expect } from 'vitest';
import calendarData from './calendar.json';
import { calendarSchema } from './schema';

// Validate the committed calendar.json against the schema — a malformed vendored file fails CI.
const calendar = calendarSchema.parse(calendarData);

describe('vendored calendar.json', () => {
	it('is the 1962 edition and self-consistent', () => {
		expect(calendar.meta.edition).toBe('roman:rubricae-1960');
		expect(calendar.meta.source).toBe('introibo Core');
		expect(calendar.meta.days).toBe(Object.keys(calendar.days).length);
	});

	// Golden spot-checks — a data-version bump that moves any of these should be reviewed.
	it('St John Bosco (the namesake) falls on Jan 31 and is white', () => {
		const day = calendar.days['2026-01-31'];
		expect(day.colour).toBe('white');
		expect(day.celebration.some((o) => o.id.includes('ioannes-bosco'))).toBe(true);
	});

	it('Christmas is white', () => {
		expect(calendar.days['2026-12-25'].colour).toBe('white');
		expect(calendar.days['2026-12-25'].season).toBe('christmastide');
	});

	it('Easter is the movable feast on 2026-04-05, in eastertide', () => {
		const easter = calendar.days['2026-04-05'];
		expect(easter.season).toBe('eastertide');
		expect(
			easter.celebration.some((o) => /resurrection/i.test(o.id) || /Resurrection/.test(o.name))
		).toBe(true);
	});

	it('Advent has violet ferias', () => {
		const advent = Object.values(calendar.days).filter(
			(d) => d.date >= '2026-11-29' && d.date <= '2026-12-24'
		);
		expect(advent.some((d) => d.colour === 'violet')).toBe(true);
	});
});
