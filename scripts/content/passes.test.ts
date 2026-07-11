import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseSpec } from './lib/ingest.mjs';
import { runPipeline, runAdaptedPasses, copyVerbatim } from './lib/passes.mjs';
import { makeFakeGenerator, FAKE_SENTINEL } from './generators/fake.mjs';

const adapted = parseSpec(
	readFileSync('scripts/content/__fixtures__/specs/adapted.topic.md', 'utf8'),
	{ where: 'adapted' }
);
const verbatim = parseSpec(
	readFileSync('scripts/content/__fixtures__/specs/verbatim.topic.md', 'utf8'),
	{ where: 'verbatim' }
);

const ctx = { model: 'fake', date: '2026-07-11' };

describe('adapted passes', () => {
	it('runs A before B and C, emits only declared tiers, records provenance', async () => {
		const fake = makeFakeGenerator();
		const { tiers } = await runAdaptedPasses(adapted, fake, ctx);

		// Pass A (→T2) runs first; B (→T1) and C (→T3) follow.
		expect(fake.calls.map((c) => c.pass)).toEqual(['A', 'B', 'C']);
		expect(fake.calls[0]).toEqual({ pass: 'A', targetTier: 2 });

		expect(Object.keys(tiers).sort()).toEqual(['1', '2', '3']);
		expect(tiers[2].method).toBe('adapted');
		expect(tiers[2].pass).toBe('A');
		expect(tiers[2].generator).toBe('fake');
		expect(tiers[2].date).toBe('2026-07-11');
	});

	it('emits only the declared tiers (partial-tier topic)', async () => {
		const partial = { ...adapted, meta: { ...adapted.meta, tiers: [1, 2] } };
		const fake = makeFakeGenerator();
		const { tiers } = await runAdaptedPasses(partial, fake, ctx);
		expect(Object.keys(tiers).sort()).toEqual(['1', '2']);
		// C never runs when Tier 3 isn't declared.
		expect(fake.calls.some((c) => c.pass === 'C')).toBe(false);
	});
});

describe('the verbatim fork (the doctrine invariant)', () => {
	it('never reaches a generator — a throwing generator still succeeds for doctrine', async () => {
		const throwing = makeThrowingGenerator();
		const { tiers } = await runPipeline(verbatim, throwing, ctx);
		expect(throwing.calls).toHaveLength(0);
		// Byte-identical to the spec text, every tier verbatim.
		expect(tiers[1].method).toBe('verbatim');
		expect(tiers[1].body).toBe(verbatim.verbatimTiers![1]);
		expect(tiers[2].body).toBe(verbatim.verbatimTiers![2]);
	});

	it('proves the seam is really wired — the same throwing generator fails an adapted topic', async () => {
		const throwing = makeThrowingGenerator();
		await expect(runPipeline(adapted, throwing, ctx)).rejects.toThrow(/boom/);
	});

	it('copyVerbatim takes no generator (arity lock)', () => {
		expect(copyVerbatim.length).toBe(1);
	});

	it('runAdaptedPasses refuses a verbatim doc', async () => {
		await expect(runAdaptedPasses(verbatim, makeFakeGenerator(), ctx)).rejects.toThrow(/doctrine/i);
	});
});

describe('fake generator', () => {
	it('places the sentinel in VISIBLE prose so it survives comment-stripping into shipped HTML', async () => {
		const fake = makeFakeGenerator();
		const { markdown } = await fake({
			pass: 'A',
			targetTier: 2,
			source: 'source text',
			topic: { title: 'X', category: 'creatures', slug: 'x', summary: 's' },
			model: 'fake'
		});
		// Strip HTML comments (which mdsvex/Svelte drop): the sentinel must still be in the visible text.
		const visible = markdown.replace(/<!--[\s\S]*?-->/g, '');
		expect(visible).toContain(FAKE_SENTINEL);
	});
});

function makeThrowingGenerator() {
	const calls: unknown[] = [];
	const gen = async () => {
		calls.push(1);
		throw new Error('boom');
	};
	return Object.assign(gen, { calls });
}
