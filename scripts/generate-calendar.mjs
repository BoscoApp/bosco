/*
 * Build-time liturgical calendar generator (1962 / traditional Roman rite).
 *
 * Calendar FACTS are not copyrightable; this is an INDEPENDENT implementation (no code ported
 * from Divinum Officium (Perl) or tridentine_calendar (Python) — both MIT and worth diffing
 * against for validation, but not vendored). Emits one JSON keyed by ISO date; the app reads it
 * client-side so Saint-of-the-Day + season colour work fully offline.
 *
 * Phase 0 scope: seasons, movable feasts (Easter-relative, incl. the Septuagesima pre-Lent block
 * the modern calendar dropped), and a curated MAJOR fixed-feast set. NOT yet a complete daily
 * sanctoral — that is early Phase 1. Simplifications are commented inline.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'lib', 'calendar', 'data');
const OUT_FILE = join(OUT_DIR, 'calendar.json');
const YEARS = [2024, 2025, 2026, 2027, 2028];

const sanctoral = JSON.parse(readFileSync(join(__dirname, 'data', 'sanctoral-1962.json'), 'utf8'));
const FIXED = new Map(sanctoral.feasts.map((f) => [`${f.month}-${f.day}`, f]));

const DAY = 86400000;
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(d.getTime() + n * DAY);
const mkUTC = (y, m, day) => new Date(Date.UTC(y, m - 1, day));

/** Gregorian Easter (Meeus/Jones/Butcher). Returns a UTC Date. */
function computus(year) {
	const a = year % 19;
	const b = Math.floor(year / 100);
	const c = year % 100;
	const d = Math.floor(b / 4);
	const e = b % 4;
	const f = Math.floor((b + 8) / 25);
	const g = Math.floor((b - f + 1) / 3);
	const h = (19 * a + b - d - g + 15) % 30;
	const i = Math.floor(c / 4);
	const k = c % 4;
	const l = (32 + 2 * e + 2 * i - h - k) % 7;
	const m = Math.floor((a + 11 * h + 22 * l) / 451);
	const month = Math.floor((h + l - 7 * m + 114) / 31);
	const day = ((h + l - 7 * m + 114) % 31) + 1;
	return mkUTC(year, month, day);
}

/** First Sunday of Advent: the last Sunday on/before Dec 24, then back three weeks. */
function adventStart(year) {
	let advent4 = mkUTC(year, 12, 24);
	while (advent4.getUTCDay() !== 0) advent4 = addDays(advent4, -1);
	return addDays(advent4, -21);
}

function classify(date, year, anchors) {
	const t = date.getTime();
	const between = (a, b) => t >= a.getTime() && t <= b.getTime();
	const { easter, ashWed, septuagesima, passionSunday, holySaturday, pentecost, advent1 } = anchors;

	// Base season + colour by date range (feasts overlaid afterwards).
	let season, color;
	if (between(advent1, mkUTC(year, 12, 24))) {
		[season, color] = ['Advent', 'violet'];
	} else if (
		between(mkUTC(year, 12, 25), mkUTC(year, 12, 31)) ||
		between(mkUTC(year, 1, 1), mkUTC(year, 1, 5))
	) {
		[season, color] = ['Christmastide', 'white'];
	} else if (between(mkUTC(year, 1, 6), addDays(septuagesima, -1))) {
		[season, color] = ['Time after Epiphany', 'green'];
	} else if (between(septuagesima, addDays(ashWed, -1))) {
		[season, color] = ['Septuagesima', 'violet'];
	} else if (between(ashWed, addDays(passionSunday, -1))) {
		[season, color] = ['Lent', 'violet'];
	} else if (between(passionSunday, holySaturday)) {
		[season, color] = ['Passiontide', 'violet'];
	} else if (between(easter, addDays(pentecost, -1))) {
		[season, color] = ['Paschaltide', 'white'];
	} else if (between(pentecost, addDays(pentecost, 6))) {
		[season, color] = ['Octave of Pentecost', 'red'];
	} else {
		[season, color] = ['Time after Pentecost', 'green'];
	}

	let feast = null;
	let rank = 'feria';

	// Rose Sundays (Gaudete / Laetare).
	if (t === addDays(advent1, 14).getTime()) color = 'rose';
	if (t === addDays(easter, -21).getTime()) color = 'rose';

	// Fixed sanctoral overlays a feria (curated subset for Phase 0).
	const fx = FIXED.get(`${date.getUTCMonth() + 1}-${date.getUTCDate()}`);
	if (fx) {
		feast = fx.name;
		color = fx.color;
		rank = 'feast';
	}

	// Major movable feasts win over everything above.
	const movable = anchors.movable.get(iso(date));
	if (movable) {
		feast = movable.name;
		color = movable.color;
		rank = 'feast';
	}

	return { season, color, feast, rank };
}

function buildYear(year) {
	const easter = computus(year);
	const anchors = {
		easter,
		ashWed: addDays(easter, -46),
		septuagesima: addDays(easter, -63),
		passionSunday: addDays(easter, -14),
		holySaturday: addDays(easter, -1),
		pentecost: addDays(easter, 49),
		advent1: adventStart(year)
	};
	anchors.movable = new Map(
		[
			[addDays(easter, -46), { name: 'Ash Wednesday', color: 'violet' }],
			[addDays(easter, -7), { name: 'Palm Sunday', color: 'violet' }],
			[addDays(easter, -3), { name: 'Maundy Thursday', color: 'white' }],
			[addDays(easter, -2), { name: 'Good Friday', color: 'black' }],
			[easter, { name: 'Easter Sunday', color: 'white' }],
			[addDays(easter, 39), { name: 'The Ascension of Our Lord', color: 'white' }],
			[addDays(easter, 49), { name: 'Pentecost', color: 'red' }],
			[addDays(easter, 56), { name: 'Trinity Sunday', color: 'white' }],
			[addDays(easter, 60), { name: 'Corpus Christi', color: 'white' }]
		].map(([d, v]) => [iso(d), v])
	);

	const entries = {};
	let cursor = mkUTC(year, 1, 1);
	const end = mkUTC(year, 12, 31);
	while (cursor.getTime() <= end.getTime()) {
		entries[iso(cursor)] = classify(cursor, year, anchors);
		cursor = addDays(cursor, 1);
	}
	return entries;
}

const calendar = {};
for (const year of YEARS) Object.assign(calendar, buildYear(year));

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(calendar) + '\n');
console.log(
	`[calendar] wrote ${Object.keys(calendar).length} days (${YEARS[0]}–${YEARS.at(-1)}) -> ${OUT_FILE}`
);
