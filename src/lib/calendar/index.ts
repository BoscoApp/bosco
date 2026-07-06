import calendarData from './calendar.json';
import type { Calendar, CalendarDay, LiturgicalColour } from './schema';

/**
 * The vendored 1962 liturgical calendar, bundled and read with zero network. Generated
 * out-of-band from introibo Core (CC0 corpus) — see scripts/calendar/ and CREDITS.md. The
 * shape is validated against the Zod schema by the test suite (`calendar.test.ts`), so this
 * import is a plain, cheap cast at runtime.
 */
export const calendar = calendarData as unknown as Calendar;

/** The liturgical day for an ISO `YYYY-MM-DD`, or undefined if outside the vendored range. */
export function dayFor(iso: string): CalendarDay | undefined {
	return calendar.days[iso];
}

/** The day's liturgical colour (drives the `data-lit` theming axis), or null if unknown. */
export function colourFor(iso: string): LiturgicalColour | null {
	return calendar.days[iso]?.colour ?? null;
}

export type { Calendar, CalendarDay, LiturgicalColour };
