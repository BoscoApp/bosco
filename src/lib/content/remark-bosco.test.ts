import { describe, it, expect, beforeEach } from 'vitest';
import { compile } from 'mdsvex';
import boscoRemark from './remark-bosco.js';
import { setGate, setTopicPaths, setGlossary, invalidate } from './catalog.js';

/**
 * Proof that the remark plugin behaves as the doctrine/offline invariants require, run through the
 * REAL mdsvex compile so it exercises the same path the build uses. The catalog is process-global, so
 * we seed it directly here (in the build, the content plugin populates it in configResolved).
 */
const opts = { extensions: ['.md'], remarkPlugins: [boscoRemark({ base: '' })] };

async function md(source: string): Promise<string> {
	const out = await compile(source, opts);
	return out?.code ?? '';
}

describe('remark-bosco (bosco: cross-links)', () => {
	beforeEach(() => {
		// Production-like gate + a fixed shipping set, independent of the real content tree.
		setGate(false);
		setTopicPaths(['world/printing-press', 'creatures/red-fox']);
		// A fixed published glossary. In production the plugin only puts APPROVED terms here, so a term
		// absent from this map stands in for both "unknown" and "pending/unreviewed".
		setGlossary([['brush', { def: `A fox's tail {tip}.`, area: 'general', status: 'approved' }]]);
	});

	it('rewrites a bosco: link to the real /library route, keeping formatted children', async () => {
		const code = await md('Read about the [**press**](bosco:world/printing-press).');
		expect(code).toContain('href="/library/world/printing-press/"');
		expect(code).toContain('<strong>press</strong>'); // children preserved, not flattened
		expect(code).not.toContain('bosco:');
	});

	it('throws on a bosco: link whose target does not ship in this build', async () => {
		await expect(md('[x](bosco:world/nonexistent)')).rejects.toThrow(/does not ship in this build/);
	});

	it('throws on a malformed bosco: target', async () => {
		await expect(md('[x](bosco:NotAValidPath)')).rejects.toThrow(/must look like/);
	});

	it('throws on an external http(s) link in prose (defense-in-depth)', async () => {
		await expect(md('[x](https://example.com)')).rejects.toThrow(/zero external links/);
	});

	it('throws on a protocol-relative external link', async () => {
		await expect(md('[x](//evil.example/x)')).rejects.toThrow(/zero external links/);
	});

	it('fail-closed: throws if the catalog gate was never set (build-ordering guard)', async () => {
		invalidate(); // gate -> null
		await expect(md('[x](bosco:world/printing-press)')).rejects.toThrow(/not initialised/);
	});

	it('leaves an ordinary root-relative link untouched', async () => {
		const code = await md('[home](/somewhere/)');
		expect(code).toContain('href="/somewhere/"');
	});

	// Reference-style links ([text][id] + [id]: url) carry the url on a separate `definition` node,
	// not a `link` node — these must be validated + rewritten just like inline links.
	it('rewrites a reference-style bosco: link (url lives on the definition node)', async () => {
		const code = await md('Read the [press][p].\n\n[p]: bosco:world/printing-press');
		expect(code).toContain('href="/library/world/printing-press/"');
		expect(code).not.toContain('bosco:');
	});

	it('throws on a dangling reference-style bosco: link', async () => {
		await expect(md('[x][d]\n\n[d]: bosco:world/does-not-exist')).rejects.toThrow(
			/does not ship in this build/
		);
	});

	it('throws on an external reference-style link', async () => {
		await expect(md('[e][ext]\n\n[ext]: https://evil.example/x')).rejects.toThrow(
			/zero external links/
		);
	});

	it('throws on an external inline image (offline invariant)', async () => {
		await expect(md('![cat](https://evil.example/cat.png)')).rejects.toThrow(/zero external links/);
	});
});

describe('remark-bosco (gloss: glossary terms)', () => {
	beforeEach(() => {
		setGate(false);
		setTopicPaths(['world/printing-press', 'creatures/red-fox']);
		setGlossary([['brush', { def: `A fox's tail {tip}.`, area: 'general', status: 'approved' }]]);
	});

	it('splices a <button class="gloss-term"> for an approved term, preserving formatted children', async () => {
		const code = await md('A tail called a [**brush**](gloss:brush).');
		expect(code).toContain('<button type="button" class="gloss-term"');
		expect(code).toContain('<strong>brush</strong>'); // visible children preserved, not flattened
		expect(code).not.toContain('gloss:'); // the protocol never reaches the output
		expect(code).not.toContain('<a '); // it's a button, not a link
	});

	it('brace-escapes the definition so Svelte cannot parse it as an expression', async () => {
		// The def `A fox's tail {tip}.` — the compile SUCCEEDING already proves Svelte did not choke on
		// the braces; assert they became numeric entities and no raw brace survived inside the attribute.
		const code = await md('A [brush](gloss:brush).');
		expect(code).toContain('&#123;tip&#125;');
		expect(code).not.toMatch(/data-gloss-def="[^"]*[{}]/);
	});

	it('HTML-escapes a definition so it can never inject markup', async () => {
		setGlossary([['x', { def: 'a <b> & "c"', area: 'general', status: 'approved' }]]);
		const code = await md('[x](gloss:x)');
		expect(code).toContain('data-gloss-def="a &lt;b&gt; &amp; &quot;c&quot;"');
	});

	it('gives the button an accessible name that flags it as a glossary term', async () => {
		const code = await md('A [brush](gloss:brush).');
		expect(code).toContain('aria-label="brush, glossary term"');
	});

	it('throws on a gloss: term that is unknown or unreviewed (absent from the shipping glossary)', async () => {
		await expect(md('[x](gloss:nonexistent)')).rejects.toThrow(/no entry that ships in this build/);
	});

	it('throws on a malformed gloss: id', async () => {
		await expect(md('[x](gloss:Not_Valid)')).rejects.toThrow(/must look like "gloss:term-id"/);
	});

	it('throws on a reference-style gloss: link (a def node can carry no visible term)', async () => {
		await expect(md('[brush][b]\n\n[b]: gloss:brush')).rejects.toThrow(
			/only valid as an inline glossary link/
		);
	});

	it('throws on a gloss: URL used as an image source', async () => {
		await expect(md('![brush](gloss:brush)')).rejects.toThrow(
			/only valid as an inline glossary link/
		);
	});

	it('resolves a gloss: term and a bosco: cross-link in the same paragraph', async () => {
		const code = await md('A [brush](gloss:brush) near the [press](bosco:world/printing-press).');
		expect(code).toContain('class="gloss-term"');
		expect(code).toContain('href="/library/world/printing-press/"');
	});

	it('fail-closed: throws if the catalog gate was never set', async () => {
		invalidate();
		await expect(md('[brush](gloss:brush)')).rejects.toThrow(/not initialised/);
	});
});

describe('deployment base', () => {
	it('is empty, so the plugin emits bare /library links (guards the base seam)', async () => {
		// remark runs at build time and cannot read the runtime $app/paths base; the plugin emits bare
		// `/library/...`. If a non-empty kit.paths.base is ever introduced, thread it into boscoRemark.
		const config = (await import('../../../svelte.config.js')).default;
		expect(config.kit?.paths?.base ?? '').toBe('');
	});
});
