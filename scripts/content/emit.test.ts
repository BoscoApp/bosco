import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import matter from 'gray-matter';
import { parseSpec } from './lib/ingest.mjs';
import { runPipeline } from './lib/passes.mjs';
import { emitTopic } from './lib/emit.mjs';
import { makeFakeGenerator } from './generators/fake.mjs';
import { canonicalize } from './lib/canonicalize.mjs';
// The REAL app schema — proves emit writes plugin-ingestible, gate-valid frontmatter.
import { topicFrontmatterSchema } from '../../src/lib/content/schema';

const adapted = parseSpec(
	readFileSync('scripts/content/__fixtures__/specs/adapted.topic.md', 'utf8'),
	{ where: 'adapted' }
);
const verbatim = parseSpec(
	readFileSync('scripts/content/__fixtures__/specs/verbatim.topic.md', 'utf8'),
	{ where: 'verbatim' }
);

let root: string;
afterEach(() => {
	if (root) rmSync(root, { recursive: true, force: true });
});

async function emit(doc: typeof adapted) {
	root = mkdtempSync(join(tmpdir(), 'bosco-emit-'));
	const contentRoot = join(root, 'content');
	const result = await runPipeline(doc, makeFakeGenerator(), { model: 'fake', date: '2026-07-11' });
	const out = await emitTopic(result, doc, {
		contentRoot,
		specPath: 'spec.md',
		date: '2026-07-11'
	});
	return { contentRoot, out };
}

describe('emitTopic', () => {
	it('writes the topic folder in the shape the plugin scans, born review_status: pending', async () => {
		const { out } = await emit(adapted);
		const { topicDir } = out;
		expect(existsSync(join(topicDir, 'index.md'))).toBe(true);
		expect(existsSync(join(topicDir, 'tier-1.md'))).toBe(true);
		expect(existsSync(join(topicDir, 'tier-2.md'))).toBe(true);
		expect(existsSync(join(topicDir, 'tier-3.md'))).toBe(true);
		expect(existsSync(join(topicDir, 'provenance.json'))).toBe(true);

		const fm = matter(readFileSync(join(topicDir, 'index.md'), 'utf8')).data;
		expect(fm.review_status).toBe('pending');
		expect(fm.sources).toHaveLength(1);
		expect(fm.related).toEqual(['world/printing-press']);
	});

	it('emits frontmatter that re-parses through the REAL topicFrontmatterSchema', async () => {
		const { out } = await emit(adapted);
		const fm = matter(readFileSync(join(out.topicDir, 'index.md'), 'utf8')).data;
		const parsed = topicFrontmatterSchema.safeParse(fm);
		expect(parsed.success).toBe(true);
	});

	it('writes index.md LAST (a crashed emit leaves an inert, index-less folder)', async () => {
		const { out } = await emit(adapted);
		// The returned write order records index.md as the final file written.
		expect(out.wrote[out.wrote.length - 1].endsWith('index.md')).toBe(true);
	});

	it('verbatim emit: each tier byte-identical, provenance all-verbatim with a sha', async () => {
		const { out } = await emit(verbatim);
		const { topicDir } = out;
		const onDisk = readFileSync(join(topicDir, 'tier-1.md'), 'utf8');
		expect(onDisk).toBe(canonicalize(verbatim.verbatimTiers![1]));

		const sidecar = JSON.parse(readFileSync(join(topicDir, 'provenance.json'), 'utf8'));
		expect(sidecar.content_kind).toBe('verbatim');
		for (const t of ['1', '2', '3']) {
			expect(sidecar.tiers[t].method).toBe('verbatim');
			expect(sidecar.tiers[t].sha256).toMatch(/^[a-f0-9]{64}$/);
			expect(sidecar.tiers[t].pass).toBeUndefined();
		}
	});
});
