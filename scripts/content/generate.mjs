#!/usr/bin/env node
/**
 * Author a topic through the content pipeline. Manual, out-of-band tooling (like scripts/calendar/) —
 * run by the owner, never by CI. Reads a spec, runs the passes (adapted) or byte-copies (verbatim),
 * and emits a `review_status: pending` topic folder the content plugin can render.
 *
 *   pnpm content:gen scripts/content/specs/creatures/red-fox.topic.md
 *   pnpm content:gen <spec> --generator=claude --model=claude-opus-4-8
 *   pnpm credits:content            # re-render the CREDITS "## Content" block from the sidecars
 *   pnpm credits:content --check    # exit 1 if that block is out of date (advisory; NOT a CI gate)
 *
 * The DEFAULT generator is the deterministic offline FAKE — its output is placeholder filler, marked so
 * the guard refuses to ship it. Pass --generator=claude (with ANTHROPIC_API_KEY set) for real prose;
 * that path is the only networked step and is loaded lazily so nothing else can reach the network.
 */
import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { parseSpec } from './lib/ingest.mjs';
import { runPipeline } from './lib/passes.mjs';
import { emitTopic, refreshCredits } from './lib/emit.mjs';
import { makeFakeGenerator } from './generators/fake.mjs';

const CONTENT_ROOT = 'src/content';
const CREDITS_PATH = 'CREDITS.md';
const DEFAULT_MODEL = process.env.BOSCO_MODEL ?? 'claude-opus-4-8';

const { values, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		generator: { type: 'string' },
		model: { type: 'string' },
		out: { type: 'string' },
		date: { type: 'string' },
		'sync-credits': { type: 'boolean' },
		check: { type: 'boolean' }
	}
});

const contentRoot = values.out ?? CONTENT_ROOT;
const today = new Date().toISOString().slice(0, 10);

async function main() {
	// Credits-only mode: re-render (or verify) the managed CREDITS block, no spec needed.
	if (values['sync-credits']) {
		const { changed } = refreshCredits(
			{ creditsPath: CREDITS_PATH, contentRoot },
			{ check: Boolean(values.check) }
		);
		if (values.check && changed) {
			console.error('✗ CREDITS.md "## Content" is out of date. Run `pnpm credits:content`.');
			process.exit(1);
		}
		console.log(
			changed ? '✓ Updated CREDITS.md "## Content".' : '✓ CREDITS.md "## Content" is up to date.'
		);
		return;
	}

	const specPath = positionals[0];
	if (!specPath) {
		console.error(
			'usage: node scripts/content/generate.mjs <spec.topic.md> [--generator=fake|claude] [--model=…]'
		);
		process.exit(1);
	}

	const ingest = parseSpec(readFileSync(specPath, 'utf8'), { where: specPath });
	const model = values.model ?? DEFAULT_MODEL;
	const generator = await resolveGenerator(values.generator, model);

	const result = await runPipeline(ingest, generator, { model, date: today });
	const { topicDir, wrote } = await emitTopic(result, ingest, {
		contentRoot,
		specPath: relative(process.cwd(), specPath).replace(/\\/g, '/'),
		date: today
	});

	// Advisory CREDITS refresh (never a gate — see refreshCredits). Only when writing to the real
	// content root; a temp/experimental --out must never touch the committed CREDITS.md.
	if (contentRoot === CONTENT_ROOT) refreshCredits({ creditsPath: CREDITS_PATH, contentRoot });

	console.log(`✓ Emitted ${ingest.kind} topic → ${topicDir} (review_status: pending)`);
	for (const f of wrote) console.log(`    ${relative(process.cwd(), f).replace(/\\/g, '/')}`);
	if (usedFake(values.generator)) {
		console.log(
			'\n  Note: the FAKE generator produced placeholder prose. Regenerate with the real'
		);
		console.log(
			'  adapter (--generator=claude) or hand-write the tiers before approving this topic.'
		);
	}
}

function usedFake(name) {
	return (name ?? process.env.BOSCO_GENERATOR ?? 'fake') !== 'claude';
}

async function resolveGenerator(name, model) {
	const choice = name ?? process.env.BOSCO_GENERATOR ?? 'fake';
	if (choice === 'claude') {
		const { makeClaudeGenerator } = await import('./generators/claude.mjs');
		return makeClaudeGenerator({ apiKey: process.env.ANTHROPIC_API_KEY, model });
	}
	if (choice !== 'fake')
		throw new Error(`Unknown generator "${choice}" (expected "fake" or "claude").`);
	return makeFakeGenerator();
}

main().catch((err) => {
	console.error(`✗ ${err.message}`);
	process.exit(1);
});
