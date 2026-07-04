import calendar from './data/calendar.json';
import { ENGLISH_NAMES } from './names';

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
	/** The winning celebration's ObservanceId — the Library↔calendar join key (see transform.ts). */
	observanceId: string | null;
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

/**
 * A "notable" feast worth previewing on the Portal look-ahead: a named day that is either a
 * sanctorale feast (a saint / Our Lady / a dedication) or a Class I temporal feast (Easter,
 * Pentecost, Corpus Christi, Christ the King …). This deliberately excludes ordinary numbered
 * Sundays ("17th Sunday after Pentecost", which are temporal rank II) and unnamed ferias, so the
 * look-ahead surfaces the feasts a child would actually mark rather than every Sunday.
 */
export function isNotableFeast(day: LiturgicalDay): boolean {
	if (day.feast === null) return false;
	// Gate the kid-facing look-ahead on a CURATED English name (names.ts): introibo ships Latin, and
	// an un-Englished saint falls back to its Latin name — those we hold back rather than show a
	// child "S. Dominici Confessoris". The rank/sanctorale test then drops ordinary numbered Sundays
	// (temporal, rank II), leaving saints and the great feasts. As names.ts grows, more feasts qualify.
	const id = day.observanceId;
	if (id === null || ENGLISH_NAMES[id] === undefined) return false;
	return id.includes(':sanctorale:') || day.rank === 'I';
}

export interface UpcomingOptions {
	/** How many days ahead to scan (default 120 — enough to always find a few notable feasts). */
	horizonDays?: number;
	/** How many feasts to return (default 4). */
	limit?: number;
	/** Which days count as worth showing (default {@link isNotableFeast}). */
	predicate?: (day: LiturgicalDay) => boolean;
}

/**
 * The next few notable feasts strictly after `from`, in date order. Walks the vendored calendar one
 * day at a time up to `horizonDays`, collecting days that satisfy `predicate`, and stops at `limit`.
 * Pure and offline; returns fewer than `limit` (or none) if the horizon or the vendored range runs
 * out first.
 */
export function upcomingFeasts(from: Date, options: UpcomingOptions = {}): LiturgicalDay[] {
	const { horizonDays = 120, limit = 4, predicate = isNotableFeast } = options;
	const out: LiturgicalDay[] = [];
	// Start on the day after `from` so "today" is never echoed back as "upcoming".
	const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1);
	for (let i = 0; i < horizonDays && out.length < limit; i++) {
		const day = getDay(cursor);
		if (day && predicate(day)) out.push(day);
		cursor.setDate(cursor.getDate() + 1);
	}
	return out;
}
