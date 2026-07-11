import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import matter from 'gray-matter';
import { verifyProvenance } from './lib/verify.mjs';
import { canonicalize, sha256 } from './lib/canonicalize.mjs';
import { FAKE_SENTINEL, makeFakeGenerator } from './generators/fake.mjs';
import { parseSpec } from './lib/ingest.mjs';
import { runPipeline } from './lib/passes.mjs';
import { emitTopic } from './lib/emit.mjs';

let root: string;
let contentRoot: string;
let registryPath: string;

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), 'bosco-verify-'));
	contentRoot = join(root, 'content');
	registryPath = join(root, 'doctrine-registry.json');
	writeFileSync(registryPath, JSON.stringify({ verbatim: ['faith/hail-mary', 'faith/*-prayer'] }));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

function writeTopic(opts: {
	category: string;
	slug: string;
	kind: 'adapted' | 'verbatim';
	reviewStatus?: string;
	tiers?: number[];
	tierBodies: Record<number, string>;
	sidecarTiers?: Record<string, object>;
	omitSidecar?: boolean;
}) {
	const { category, slug, kind, tierBodies } = opts;
	const tiers = opts.tiers ?? Object.keys(tierBodies).map(Number);
	const dir = join(contentRoot, category, slug);
	mkdirSync(dir, { recursive: true });

	for (const [t, body] of Object.entries(tierBodies)) {
		writeFileSync(join(dir, `tier-${t}.md`), canonicalize(body));
	}
	writeFileSync(
		join(dir, 'index.md'),
		matter.stringify('notes', {
			title: `T ${slug}`,
			category,
			summary: 's',
			tiers,
			review_status: opts.reviewStatus ?? 'pending'
		})
	);
	if (!opts.omitSidecar) {
		writeFileSync(
			join(dir, 'provenance.json'),
			JSON.stringify({
				topic: `${category}/${slug}`,
				content_kind: kind,
				tiers: opts.sidecarTiers ?? {}
			})
		);
	}
	return dir;
}

async function verbatimSidecar(tierBodies: Record<number, string>) {
	const out: Record<string, object> = {};
	for (const [t, body] of Object.entries(tierBodies)) {
		out[t] = { method: 'verbatim', sha256: await sha256(body) };
	}
	return out;
}

const run = () => verifyProvenance({ contentRoot, registryPath });

describe('verifyProvenance', () => {
	it('passes a clean tree (adapted creature + verbatim prayer with matching shas)', async () => {
		writeTopic({
			category: 'creatures',
			slug: 'red-fox',
			kind: 'adapted',
			tierBodies: { 2: 'clean prose' },
			sidecarTiers: { 2: { method: 'adapted', pass: 'A', generator: 'claude', model: 'm' } }
		});
		const bodies = { 1: 'Hail Mary...', 2: 'Hail Mary...', 3: 'Hail Mary...' };
		writeTopic({
			category: 'faith',
			slug: 'hail-mary',
			kind: 'verbatim',
			tierBodies: bodies,
			sidecarTiers: await verbatimSidecar(bodies)
		});
		expect(run().ok).toBe(true);
	});

	it('fails a faith topic with NO provenance.json (mandatory faith provenance — the doctrine hole fix)', () => {
		writeTopic({
			category: 'faith',
			slug: 'act-of-contrition',
			kind: 'verbatim',
			tierBodies: { 2: 'O my God...' },
			omitSidecar: true
		});
		const { ok, violations } = run();
		expect(ok).toBe(false);
		expect(violations.join('\n')).toMatch(/no provenance\.json/i);
	});

	it('fails a verbatim topic whose tier was produced by an adaptation pass', () => {
		writeTopic({
			category: 'faith',
			slug: 'some-prayer',
			kind: 'verbatim',
			tierBodies: { 2: 'text' },
			sidecarTiers: { 2: { method: 'adapted', pass: 'A', generator: 'claude', model: 'm' } }
		});
		expect(run().violations.join('\n')).toMatch(/adaptation pass ran over doctrine/i);
	});

	it('fails a doctrine-registry-matched topic authored as adapted', () => {
		writeTopic({
			category: 'faith',
			slug: 'hail-mary',
			kind: 'adapted',
			tierBodies: { 2: 'paraphrase' },
			sidecarTiers: { 2: { method: 'adapted', pass: 'A', generator: 'claude', model: 'm' } }
		});
		expect(run().violations.join('\n')).toMatch(/must be byte-copied/i);
	});

	it('fails a verbatim body that was hand-edited after emit (sha mismatch)', async () => {
		const bodies = { 2: 'original doctrine' };
		writeTopic({
			category: 'faith',
			slug: 'some-prayer',
			kind: 'verbatim',
			tierBodies: { 2: 'TAMPERED doctrine' },
			sidecarTiers: await verbatimSidecar(bodies) // sha of the ORIGINAL, not what's on disk
		});
		expect(run().violations.join('\n')).toMatch(/edited after emit/i);
	});

	it('fails an APPROVED topic that still has a fake-generated tier (gate fix)', () => {
		writeTopic({
			category: 'creatures',
			slug: 'badger',
			kind: 'adapted',
			reviewStatus: 'approved',
			tierBodies: { 2: 'placeholder' },
			sidecarTiers: { 2: { method: 'adapted', pass: 'A', generator: 'fake', model: 'fake' } }
		});
		expect(run().violations.join('\n')).toMatch(/FAKE-generated body/i);
	});

	it('fails an APPROVED body containing the fake sentinel even without a fake generator record', () => {
		writeTopic({
			category: 'creatures',
			slug: 'otter',
			kind: 'adapted',
			reviewStatus: 'approved',
			tierBodies: { 2: `real-looking prose <!-- ${FAKE_SENTINEL} --> still here` },
			sidecarTiers: { 2: { method: 'adapted', pass: 'A', generator: 'claude', model: 'm' } }
		});
		expect(run().violations.join('\n')).toMatch(/fake-draft sentinel/i);
	});

	it('does not false-positive on CRLF-checked-out verbatim bodies (the autocrlf trap)', async () => {
		const canonical = { 2: 'doctrine line one\ndoctrine line two' };
		const dir = join(contentRoot, 'faith', 'some-prayer');
		mkdirSync(dir, { recursive: true });
		// Write the tier body with CRLF endings, as Git might on a Windows checkout.
		writeFileSync(join(dir, 'tier-2.md'), 'doctrine line one\r\ndoctrine line two\r\n');
		writeFileSync(
			join(dir, 'index.md'),
			matter.stringify('notes', {
				title: 'T',
				category: 'faith',
				summary: 's',
				tiers: [2],
				review_status: 'pending'
			})
		);
		writeFileSync(
			join(dir, 'provenance.json'),
			JSON.stringify({
				topic: 'faith/some-prayer',
				content_kind: 'verbatim',
				tiers: await verbatimSidecar(canonical)
			})
		);
		expect(run().ok).toBe(true);
	});

	it('tolerates non-doctrine topics with no sidecar (creatures/world stay optional)', () => {
		writeTopic({
			category: 'creatures',
			slug: 'hand-authored',
			kind: 'adapted',
			tierBodies: { 2: 'hand written' },
			omitSidecar: true
		});
		expect(run().ok).toBe(true);
	});

	it('fails a verbatim tier whose sidecar record omits sha256 (the fail-open fix)', () => {
		writeTopic({
			category: 'faith',
			slug: 'some-prayer',
			kind: 'verbatim',
			tierBodies: { 2: 'paraphrased doctrine' },
			sidecarTiers: { 2: { method: 'verbatim' } } // no sha256 — used to short-circuit the check
		});
		expect(run().violations.join('\n')).toMatch(/no recorded sha256/i);
	});

	it('fails a verbatim topic that renders a tier its sidecar omits (the unlisted-tier fix)', async () => {
		const dir = join(contentRoot, 'faith', 'some-prayer');
		mkdirSync(dir, { recursive: true });
		writeFileSync(join(dir, 'tier-1.md'), canonicalize('doctrine one'));
		writeFileSync(join(dir, 'tier-2.md'), canonicalize('UNVETTED tier two')); // renders, but not in sidecar
		writeFileSync(
			join(dir, 'index.md'),
			matter.stringify('notes', {
				title: 'T',
				category: 'faith',
				summary: 's',
				tiers: [1, 2],
				review_status: 'pending'
			})
		);
		writeFileSync(
			join(dir, 'provenance.json'),
			JSON.stringify({
				topic: 'faith/some-prayer',
				content_kind: 'verbatim',
				tiers: await verbatimSidecar({ 1: 'doctrine one' }) // tier 2 deliberately omitted
			})
		);
		expect(run().violations.join('\n')).toMatch(/no record for it/i);
	});

	it('fails an APPROVED body carrying the sentinel even in a tier the sidecar omits', () => {
		const dir = join(contentRoot, 'creatures', 'otter');
		mkdirSync(dir, { recursive: true });
		writeFileSync(join(dir, 'tier-2.md'), canonicalize(`real-looking prose. ${FAKE_SENTINEL}`));
		writeFileSync(
			join(dir, 'index.md'),
			matter.stringify('notes', {
				title: 'T',
				category: 'creatures',
				summary: 's',
				tiers: [2],
				review_status: 'approved'
			})
		);
		writeFileSync(
			join(dir, 'provenance.json'),
			JSON.stringify({ topic: 'creatures/otter', content_kind: 'adapted', tiers: {} }) // empty sidecar
		);
		expect(run().violations.join('\n')).toMatch(/fake-draft sentinel/i);
	});

	it('round-trip: an emitted verbatim topic verifies clean, and tampering its body then fails', async () => {
		const doc = parseSpec(
			readFileSync('scripts/content/__fixtures__/specs/verbatim.topic.md', 'utf8'),
			{ where: 'v' }
		);
		const result = await runPipeline(doc, makeFakeGenerator(), {
			model: 'fake',
			date: '2026-07-11'
		});
		await emitTopic(result, doc, { contentRoot, specPath: 'spec.md', date: '2026-07-11' });
		expect(run().ok).toBe(true);

		// Hand-edit the frozen doctrine body — the sha lock must now fire.
		writeFileSync(join(contentRoot, 'faith', 'test-doxology', 'tier-2.md'), 'TAMPERED doctrine\n');
		expect(run().ok).toBe(false);
	});
});
