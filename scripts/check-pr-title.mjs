#!/usr/bin/env node
/**
 * PR-title lint — Conventional Commits (+ Bosco's custom `content:` type).
 * Run in `ci` on pull requests; the title also drives release-please.
 *
 * Usage: node scripts/check-pr-title.mjs "feat(library): tiered rendering"
 */
const TYPES = [
	'feat',
	'fix',
	'perf',
	'refactor',
	'docs',
	'test',
	'build',
	'ci',
	'chore',
	'revert',
	'style',
	'content'
];

const title = (process.argv[2] ?? '').trim();
const pattern = new RegExp(`^(${TYPES.join('|')})(\\([a-z0-9/._ -]+\\))?(!)?: .{1,}$`);

if (!pattern.test(title)) {
	console.error(`\n✗ PR title is not a Conventional Commit:\n    "${title}"\n`);
	console.error('  Expected:  type(scope): summary   (scope and ! are optional)');
	console.error(`  Types:     ${TYPES.join(', ')}\n`);
	process.exit(1);
}

console.log(`✓ PR title OK: ${title}`);
