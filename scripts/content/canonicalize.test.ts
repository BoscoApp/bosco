import { describe, it, expect } from 'vitest';
import { canonicalize, sha256 } from './lib/canonicalize.mjs';

describe('canonicalize', () => {
	it('collapses CRLF and CR to LF', () => {
		expect(canonicalize('a\r\nb\rc')).toBe('a\nb\nc\n');
	});

	it('strips a leading BOM', () => {
		expect(canonicalize('\uFEFFhello')).toBe('hello\n');
	});

	it('guarantees exactly one trailing newline', () => {
		expect(canonicalize('x')).toBe('x\n');
		expect(canonicalize('x\n\n\n')).toBe('x\n');
	});

	it('gives CRLF and LF forms of the same text an identical sha (the autocrlf guard)', async () => {
		const crlf = await sha256('Line one\r\nLine two\r\n');
		const lf = await sha256('Line one\nLine two');
		expect(crlf).toBe(lf);
	});
});
