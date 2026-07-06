/**
 * Liturgy — resolves *today* from the vendored calendar so the desktop wallpaper and the
 * Day-of-the-Day panel follow the Church's year. Everything here reads `$lib/calendar` (the
 * bundled `calendar.json`); nothing touches the network. The reference mockup's inline Easter
 * calculator was only a stand-in — this is the real source.
 */
import { dayFor, type CalendarDay, type LiturgicalColour } from '../calendar';

/** The wallpaper axis: the five liturgical colour bases + the rose modifier (Gaudete/Laetare). */
export type LitKey = LiturgicalColour | 'rose';

const SEASON_LABEL: Record<string, string> = {
	advent: 'Advent',
	christmastide: 'Christmastide',
	epiphany: 'Time after Epiphany',
	septuagesima: 'Septuagesima',
	lent: 'Lent',
	passiontide: 'Passiontide',
	eastertide: 'Eastertide',
	pentecost: 'Time after Pentecost'
};

const COLOUR_NAME: Record<LitKey, string> = {
	white: 'White',
	red: 'Red',
	green: 'Green',
	violet: 'Violet',
	black: 'Black',
	rose: 'Rose'
};

/** 1960 rubrics rank feasts I–IV; IV is a ferial day. */
const RANK_LABEL: Record<string, string> = {
	I: '1st Class',
	II: '2nd Class',
	III: '3rd Class',
	IV: 'Ferial'
};

function titleCase(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Local `YYYY-MM-DD` for a Date (calendar keys are local civil dates, not UTC). */
export function isoDate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

/** The day's wallpaper colour: rose when the day is rose, else the base colour, else green. */
export function litKeyFor(day: CalendarDay | undefined): LitKey {
	if (!day) return 'green';
	if (day.rose) return 'rose';
	return day.colour ?? 'green';
}

export interface Today {
	iso: string;
	inRange: boolean;
	litKey: LitKey;
	colourName: string;
	season: string;
	/** The day's office or saint (Latin, as the Missal names it). */
	title: string;
	rank: string | null;
	isSaint: boolean;
	dateLabel: string;
}

/** A safe, generic default used during SSR/prerender (corrected on the client at mount). */
export const DEFAULT_TODAY: Today = {
	iso: '',
	inRange: false,
	litKey: 'green',
	colourName: 'Green',
	season: 'Time after Pentecost',
	title: 'Time after Pentecost',
	rank: null,
	isSaint: false,
	dateLabel: ''
};

/**
 * Resolve the liturgical facts for `now` (default: the real current day, in the browser).
 * On a ferial day with a saint's commemoration, the saint is surfaced as the day's figure.
 */
export function resolveToday(now: Date = new Date()): Today {
	const iso = isoDate(now);
	const day = dayFor(iso);
	const litKey = litKeyFor(day);
	const season = day?.season
		? (SEASON_LABEL[day.season] ?? titleCase(day.season))
		: DEFAULT_TODAY.season;
	const dateLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

	let title = season;
	let rank: string | null = null;
	let isSaint = false;

	if (day) {
		const cel = day.celebration[0];
		const ferial = cel?.rank === 'IV';
		if (ferial && day.commemoration.length > 0) {
			title = day.commemoration[0].name;
			rank = 'Commemoration';
			isSaint = true;
		} else if (cel) {
			title = cel.name;
			rank = RANK_LABEL[cel.rank] ?? cel.rank;
			isSaint = !cel.id.includes(':temporale:');
		}
	}

	return {
		iso,
		inRange: !!day,
		litKey,
		colourName: COLOUR_NAME[litKey],
		season,
		title,
		rank,
		isSaint,
		dateLabel
	};
}

/** The house verse — Don Bosco's motto text. Verbatim Scripture; never AI-adapted. */
export const DAY_VERSE = {
	lat: 'Sinite parvulos venire ad me',
	en: 'Suffer the little children to come unto me',
	ref: 'Mark 10:14'
} as const;
