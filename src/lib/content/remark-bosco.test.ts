import { describe, it, expect, beforeEach } from 'vitest';
import { compile } from 'mdsvex';
import boscoRemark from './remark-bosco.js';
import { setGate, setTopicPaths, invalidate } from './catalog.js';

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

describe('deployment base', () => {
	it('is empty, so the plugin emits bare /library links (guards the base seam)', async () => {
		// remark runs at build time and cannot read the runtime $app/paths base; the plugin emits bare
		// `/library/...`. If a non-empty kit.paths.base is ever introduced, thread it into boscoRemark.
		const config = (await import('../../../svelte.config.js')).default;
		expect(config.kit?.paths?.base ?? '').toBe('');
	});
});
