#!/usr/bin/env node
/**
 * Project introibo Core day-contracts into Bosco's compact, committed calendar.json.
 *
 * Reads the full-contract dump produced out-of-band by `dump-contracts.php`
 * (`{ "Y-m-d": <DayContract>, ... }`) and writes a small per-day projection Bosco reads at
 * runtime with zero network: the liturgical colour (drives `data-lit`), the season, and the
 * celebrated / commemorated offices with their stable observance ids (the Library↔Chapel join).
 *
 * The output is version-stamped from the contract itself (corpus/engine/contract versions), so a
 * data-version bump is visible in the committed file and its golden spot-check tests.
 *
 * Usage: node vendor-calendar.mjs INPUT_DUMP [OUTPUT_JSON]
 *   (default OUTPUT_JSON = src/lib/calendar/calendar.json)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const inputPath = process.argv[2];
const outPath = process.argv[3] ?? 'src/lib/calendar/calendar.json';

if (!inputPath) {
	console.error('usage: node vendor-calendar.mjs INPUT_DUMP [OUTPUT_JSON]');
	process.exit(1);
}

const raw = JSON.parse(readFileSync(inputPath, 'utf8'));
const dates = Object.keys(raw).sort();
if (dates.length === 0) {
	console.error('✗ No days in the dump.');
	process.exit(1);
}

const pickName = (o) => o.names?.en ?? o.names?.la ?? o.id;
const office = (o) => ({
	id: o.id,
	rank: o.rank,
	name: pickName(o),
	colour: o.colour?.base ?? null,
	roseAllowed: Boolean(o.colour?.roseAllowed)
});
const primaryOf = (c) => c.celebration?.[0] ?? c.tempora?.[0] ?? null;

let rite, edition, contractVersion, corpusVersion, engineVersion;
const days = {};

for (const date of dates) {
	const c = raw[date];
	rite ??= c.rite;
	edition ??= c.edition;
	contractVersion ??= c.contractVersion;
	corpusVersion ??= c.corpusVersion;
	engineVersion ??= c.engineVersion;

	const primary = primaryOf(c);
	days[date] = {
		date,
		season: c.season ?? null,
		colour: primary?.colour?.base ?? null,
		rose: Boolean(primary?.colour?.roseAllowed),
		celebration: (c.celebration ?? []).map(office),
		commemoration: (c.commemoration ?? []).map((o) => ({ id: o.id, name: pickName(o) }))
	};
}

const calendar = {
	meta: {
		source: 'introibo Core',
		rite,
		edition,
		contractVersion,
		corpusVersion,
		engineVersion,
		range: { start: dates[0], end: dates[dates.length - 1] },
		days: dates.length
	},
	days
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(calendar, null, '\t') + '\n');
console.log(
	`✓ Wrote ${outPath}: ${dates.length} days (${dates[0]} … ${dates[dates.length - 1]}), ` +
		`corpus ${corpusVersion}, engine ${engineVersion}, contract ${contractVersion}`
);
