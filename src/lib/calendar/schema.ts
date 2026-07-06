import { z } from 'zod';

/** Liturgical colour bases (rose is a modifier via `rose`, never a base — per the contract). */
export const LITURGICAL_COLOURS = ['white', 'red', 'green', 'violet', 'black'] as const;
export type LiturgicalColour = (typeof LITURGICAL_COLOURS)[number];

const officeSchema = z.object({
	id: z.string(),
	rank: z.string(),
	name: z.string(),
	colour: z.enum(LITURGICAL_COLOURS).nullable(),
	roseAllowed: z.boolean()
});

const commemorationSchema = z.object({
	id: z.string(),
	name: z.string()
});

export const calendarDaySchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	season: z.string().nullable(),
	colour: z.enum(LITURGICAL_COLOURS).nullable(),
	rose: z.boolean(),
	celebration: z.array(officeSchema),
	commemoration: z.array(commemorationSchema)
});
export type CalendarDay = z.infer<typeof calendarDaySchema>;

export const calendarSchema = z.object({
	meta: z.object({
		source: z.string(),
		rite: z.string(),
		edition: z.string(),
		contractVersion: z.string(),
		corpusVersion: z.string(),
		engineVersion: z.string(),
		range: z.object({ start: z.string(), end: z.string() }),
		days: z.number()
	}),
	days: z.record(z.string(), calendarDaySchema)
});
export type Calendar = z.infer<typeof calendarSchema>;
