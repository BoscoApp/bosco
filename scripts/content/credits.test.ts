import { describe, it, expect } from 'vitest';
import {
	renderCreditsBlock,
	spliceCreditsBlock,
	CREDITS_BEGIN,
	CREDITS_END
} from './lib/provenance.mjs';

const verbatimSidecar = {
	topic: 'faith/hail-mary',
	content_kind: 'verbatim',
	sources: [{ title: 'Traditional', license: 'Public domain' }],
	tiers: { 1: { method: 'verbatim' }, 2: { method: 'verbatim' }, 3: { method: 'verbatim' } }
};
const adaptedSidecar = {
	topic: 'creatures/red-fox',
	content_kind: 'adapted',
	sources: [{ title: 'PD natural-history notes' }],
	tiers: {
		1: { method: 'adapted', pass: 'B', generator: 'claude', model: 'claude-opus-4-8' },
		2: { method: 'adapted', pass: 'A', generator: 'claude', model: 'claude-opus-4-8' },
		3: { method: 'adapted', pass: 'C', generator: 'claude', model: 'claude-opus-4-8' }
	}
};

describe('renderCreditsBlock', () => {
	it('labels verbatim vs AI-adapted and never emits an AI vanity line', () => {
		const block = renderCreditsBlock([adaptedSidecar, verbatimSidecar]);
		expect(block).toContain('**creatures/red-fox** — AI-adapted (claude-opus-4-8, passes A/B/C)');
		expect(block).toContain('**faith/hail-mary** — Verbatim (public domain)');
		// Factual provenance only — no "Generated with", no tool emoji, no assistant email.
		expect(block).not.toMatch(/generated with|co-authored|🤖|claude@/i);
	});

	it('renders a prettier-stable bullet list (no markdown table pipes)', () => {
		const block = renderCreditsBlock([adaptedSidecar]);
		for (const line of block.split('\n')) expect(line.startsWith('- ')).toBe(true);
	});

	it('handles the empty case', () => {
		expect(renderCreditsBlock([])).toMatch(/no tool-emitted topics/i);
	});
});

describe('spliceCreditsBlock', () => {
	it('replaces only the managed region between the markers', () => {
		const before = `# Credits\n\n## Content\n\n${CREDITS_BEGIN}\n\nold\n\n${CREDITS_END}\n\n## Fonts\n`;
		const next = spliceCreditsBlock(before, '- **x** — new');
		expect(next).toContain('- **x** — new');
		expect(next).not.toContain('old');
		expect(next).toContain('## Fonts');
	});

	it('throws if the markers are missing', () => {
		expect(() => spliceCreditsBlock('# Credits\nno markers', 'x')).toThrow(/markers/i);
	});
});
