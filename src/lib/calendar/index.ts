import calendar from './data/calendar.json';

// Client-side reader over the build-time 1962 calendar JSON. Pure and offline: no network, no
// server. Saint-of-the-Day + season colour are computed from bundled data (brief §2.1, §5).

export type LiturgicalColor = 'green' | 'violet' | 'white' | 'gold' | 'red' | 'rose' | 'black';

export interface LiturgicalDay {
	/** ISO YYYY-MM-DD */
	date: string;
	season: string;
	color: LiturgicalColor;
	feast: string | null;
	rank: string;
}

const data = calendar as Record<string, Omit<LiturgicalDay, 'date'>>;

/** Local calendar date -> ISO key, without the UTC shift `toISOString` would introduce. */
function isoOf(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

/** Look up a day. Returns null if the date is outside the generated range. */
export function getDay(date: Date): LiturgicalDay | null {
	const key = isoOf(date);
	const entry = data[key];
	return entry ? { date: key, ...entry } : null;
}

export function getToday(): LiturgicalDay | null {
	return getDay(new Date());
}

/** Saint-of-the-Day display label: the feast if any, else the ferial day of its season. */
export function saintOfDayLabel(day: LiturgicalDay): string {
	return day.feast ?? `Feria — ${day.season}`;
}
