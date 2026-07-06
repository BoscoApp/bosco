import { describe, it, expect } from 'vitest';
import { resolveToday, litKeyFor, isoDate } from './liturgy';

describe('liturgy resolver (reads the vendored calendar)', () => {
	it('formats a local ISO date', () => {
		expect(isoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
		expect(isoDate(new Date(2026, 11, 25))).toBe('2026-12-25');
	});

	it('resolves a ferial day: today-style green weekday, no saint', () => {
		const t = resolveToday(new Date(2026, 6, 6));
		expect(t.inRange).toBe(true);
		expect(t.litKey).toBe('green');
		expect(t.colourName).toBe('Green');
		expect(t.season).toBe('Time after Pentecost');
		expect(t.rank).toBe('Ferial');
		expect(t.isSaint).toBe(false);
	});

	it('resolves a saint feast (St John Bosco, Jan 31 — white)', () => {
		const t = resolveToday(new Date(2026, 0, 31));
		expect(t.litKey).toBe('white');
		expect(t.season).toBe('Time after Epiphany');
		expect(t.title).toContain('Bosco');
		expect(t.isSaint).toBe(true);
	});

	it('resolves Christmas as white Christmastide', () => {
		const t = resolveToday(new Date(2026, 11, 25));
		expect(t.litKey).toBe('white');
		expect(t.season).toBe('Christmastide');
		expect(t.isSaint).toBe(false); // the Nativity is a temporale office, not a saint
	});

	it('maps the rose modifier over the base colour', () => {
		expect(litKeyFor({ rose: true, colour: 'violet' } as never)).toBe('rose');
		expect(litKeyFor({ rose: false, colour: 'violet' } as never)).toBe('violet');
		expect(litKeyFor(undefined)).toBe('green');
	});

	it('falls back gracefully outside the vendored range', () => {
		const t = resolveToday(new Date(2030, 0, 1));
		expect(t.inRange).toBe(false);
		expect(t.litKey).toBe('green');
		expect(t.season).toBe('Time after Pentecost');
	});
});
