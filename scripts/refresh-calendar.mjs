/*
 * Re-vendor the 1962 liturgical calendar from introibo.org.
 *
 * introibo (github.com/Introibo-App) is the owner's sibling project: a validated 1962 / 1960-rubrics
 * calendar engine. Its COMPILED calendar data is CC0 (calendar facts are not copyrightable anyway),
 * which is clean to vendor into Bosco (MIT/CC). The introibo ENGINE is AGPL — we consume its data
 * OUTPUT over the public API, never its code.
 *
 * This script hits the network DELIBERATELY and is run by hand (`npm run refresh:calendar`), NOT at
 * build time. It fetches whole years, transforms each day to Bosco's shape (see transform.ts), and
 * writes the COMMITTED src/lib/calendar/data/calendar.json. The app build then reads that committed
 * file with zero network — the runtime offline invariant is preserved.
 *
 *   npm run refresh:calendar            # default year range
 *   npm run refresh:calendar 2024 2040  # explicit [START END]
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { transformDay } from '../src/lib/calendar/transform.ts';

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(here, '..', 'src', 'lib', 'calendar', 'data');
const OUT_FILE = join(OUT_DIR, 'calendar.json');
const META_FILE = join(OUT_DIR, 'calendar.meta.json');

const API = 'https://introibo.org/api/v1';
const SYSTEM = '1962';
const CALENDAR = 'universal'; // NOT `sspx` — Bosco stays free of SSPX branding
const LANG = 'la'; // introibo ships Latin only; English comes from names.ts

const START = Number(process.argv[2] ?? 2024);
const END = Number(process.argv[3] ?? 2032);

if (!Number.isInteger(START) || !Number.isInteger(END) || START > END) {
	console.error(`Bad range: ${process.argv[2]}..${process.argv[3]}`);
	process.exit(1);
}

const VALID = new Set(['green', 'violet', 'white', 'gold', 'red', 'rose', 'black']);

async function fetchYear(year) {
	const url = `${API}/year/${year}?system=${SYSTEM}&calendar=${CALENDAR}&lang=${LANG}`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`introibo ${year}: HTTP ${res.status} ${res.statusText}`);
	const body = await res.json();
	if (!Array.isArray(body?.data)) throw new Error(`introibo ${year}: unexpected payload shape`);
	return body;
}

const calendar = {};
let dataVersion = null;

for (let year = START; year <= END; year++) {
	const { data, meta } = await fetchYear(year);
	if (meta?.dataVersion) dataVersion = meta.dataVersion;
	for (const day of data) {
		const entry = transformDay(day);
		if (!VALID.has(entry.color)) throw new Error(`${day.date}: bad colour "${entry.color}"`);
		calendar[day.date] = entry;
	}
	console.log(`[calendar] ${year}: ${data.length} days`);
}

const dates = Object.keys(calendar);
if (dates.length === 0) throw new Error('refused to write an empty calendar');

mkdirSync(OUT_DIR, { recursive: true });
// Minified to keep the bundled payload small (the reader imports this file directly).
writeFileSync(OUT_FILE, JSON.stringify(calendar) + '\n');

const meta = {
	source: 'introibo.org',
	sourceUrl: API,
	license: 'CC0-1.0',
	system: SYSTEM,
	calendar: CALENDAR,
	lang: LANG,
	dataVersion,
	range: [START, END],
	days: dates.length,
	note: 'Compiled 1962 calendar DATA (CC0) from introibo.org, transformed to Bosco shape by scripts/refresh-calendar.mjs. The introibo engine is AGPL; only its CC0 data output is vendored. Regenerate with: npm run refresh:calendar [START END].'
};
writeFileSync(META_FILE, JSON.stringify(meta, null, 2) + '\n');

console.log(
	`[calendar] wrote ${dates.length} days ${START}-${END} (introibo dataVersion ${dataVersion}) -> ${OUT_FILE}`
);
