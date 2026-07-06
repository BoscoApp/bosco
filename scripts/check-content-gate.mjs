#!/usr/bin/env node
/**
 * Content-gate guard — proves the doctrine gate in the real production output.
 *
 * Rule 5: `review_status: pending` content is excluded from production builds. This scans the
 * built `build/` output and fails if any unreviewed sentinel leaked in, and also fails if the
 * approved topics went missing (which would mean the gate over-filtered).
 *
 * Run against a PRODUCTION build (no CONTENT_PREVIEW): `pnpm build && pnpm guard:content`.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const BUILD_DIR = 'build';

// Must NOT appear anywhere in a production build (the pending dummy topic).
const MUST_BE_ABSENT = ['PENDING_SENTINEL_DO_NOT_SHIP', 'Draft Basilisk', 'basilisk-draft'];
// Must appear (the approved dummy topics render in the Library listing).
const MUST_BE_PRESENT = ['The Red Fox', 'The Printing Press'];

const TEXT_EXT = new Set([
	'.html',
	'.js',
	'.mjs',
	'.css',
	'.json',
	'.svg',
	'.txt',
	'.webmanifest',
	'.xml'
]);

async function* walk(dir) {
	let entries;
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch {
		console.error(`✗ Content-gate: "${dir}/" not found. Run \`pnpm build\` first.`);
		process.exit(1);
	}
	for (const entry of entries) {
		const p = join(dir, entry.name);
		if (entry.isDirectory()) yield* walk(p);
		else yield p;
	}
}

let blob = '';
for await (const file of walk(BUILD_DIR)) {
	const ext = extname(file).toLowerCase();
	if (ext === '.map' || !TEXT_EXT.has(ext)) continue;
	blob += '\n' + (await readFile(file, 'utf8'));
}

const leaked = MUST_BE_ABSENT.filter((t) => blob.includes(t));
const missing = MUST_BE_PRESENT.filter((t) => !blob.includes(t));

if (leaked.length || missing.length) {
	console.error('\n✗ Content-gate failed:');
	if (leaked.length) {
		console.error(`   Unreviewed content leaked into ${BUILD_DIR}/: ${leaked.join(', ')}`);
		console.error('   Pending/draft topics must be excluded from production builds.');
	}
	if (missing.length) {
		console.error(`   Approved content missing from ${BUILD_DIR}/: ${missing.join(', ')}`);
		console.error('   The gate over-filtered — approved topics should ship.');
	}
	console.error('');
	process.exit(1);
}

console.log('✓ Content-gate: pending content excluded, approved content present.');
