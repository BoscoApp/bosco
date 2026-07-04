// Transform an introibo day-contract into Bosco's calendar entry shape. Runs at VENDOR time only
// (scripts/refresh-calendar.mjs), never in the app: the app reads the already-transformed
// data/calendar.json. Kept pure and dependency-free so the refresh script can import it directly
// under Node's native TypeScript execution.
//
// Colour rules (validated against introibo 1962 data):
//   • white  + Class I (rankOrdinal 1)  -> gold   (Bosco lifts the greatest feasts to gold)
//   • violet + roseAllowed               -> rose   (Gaudete / Laetare)
//   • otherwise the liturgical base maps 1:1 (green | violet | white | red | black)

import { englishName } from './names.ts';

export type LiturgicalColor = 'green' | 'violet' | 'white' | 'gold' | 'red' | 'rose' | 'black';

/** The subset of an introibo day-contract that the transform consumes. */
export interface IntroiboColour {
	base?: string;
	roseAllowed?: boolean;
}
export interface IntroiboCelebration {
	id?: string;
	rank?: string;
	rankOrdinal?: number;
	kind?: string;
	colour?: IntroiboColour;
	names?: { la?: string };
}
export interface IntroiboDay {
	date: string;
	season?: string;
	celebration?: IntroiboCelebration[];
}

/** Bosco's per-day entry (the reader adds `date` from the JSON key). */
export interface CalendarEntry {
	season: string;
	color: LiturgicalColor;
	feast: string | null;
	rank: string;
	/**
	 * The winning celebration's stable ObservanceId (introibo's `id`), or null if the day carries no
	 * celebration. This is the Library↔calendar join key: a Faith article declares the same
	 * ObservanceId in its frontmatter, so the reader can link a day to its article. It also drives the
	 * "notable feast" filter for the Portal look-ahead (sanctorale ids + Class I temporal feasts).
	 */
	observanceId: string | null;
}

// introibo season code -> Bosco display label. Insulates Bosco from introibo's still-open season
// vocabulary (their #90); an unknown code falls back to a capitalised form.
const SEASON_LABELS: Record<string, string> = {
	advent: 'Advent',
	christmastide: 'Christmastide',
	epiphany: 'Time after Epiphany',
	septuagesima: 'Septuagesima',
	lent: 'Lent',
	passiontide: 'Passiontide',
	eastertide: 'Paschaltide',
	pentecost: 'Time after Pentecost'
};

const BASE_COLORS: readonly LiturgicalColor[] = ['green', 'violet', 'white', 'red', 'black'];

export function seasonLabel(code: string | undefined): string {
	if (!code) return 'Time after Pentecost';
	const mapped = SEASON_LABELS[code];
	if (mapped) return mapped;
	return code.charAt(0).toUpperCase() + code.slice(1);
}

export function liturgicalColor(
	base: string | undefined,
	roseAllowed: boolean | undefined,
	rankOrdinal: number | undefined
): LiturgicalColor {
	const b = (base ?? 'green').toLowerCase();
	if (b === 'white' && rankOrdinal === 1) return 'gold';
	if (b === 'violet' && roseAllowed) return 'rose';
	if ((BASE_COLORS as readonly string[]).includes(b)) return b as LiturgicalColor;
	return 'green'; // defensive: unrecognised base colour
}

export function transformDay(day: IntroiboDay): CalendarEntry {
	const c = day.celebration?.[0] ?? {};
	const season = seasonLabel(day.season);
	const color = liturgicalColor(c.colour?.base, c.colour?.roseAllowed, c.rankOrdinal);
	// Plain ferias carry no fallback: unnamed ones become the reader's "Feria — {season}". Every
	// other kind (Sunday, feast, octave day, vigil) falls back to its Latin name until an English
	// name (and, later, a Library article) is authored.
	const feast = c.kind === 'feria' ? englishName(c.id, null) : englishName(c.id, c.names?.la);
	const rank = c.rank ?? '';
	const observanceId = c.id ?? null;
	return { season, color, feast, rank, observanceId };
}
